import * as anchor from "@coral-xyz/anchor";
import { Program, Idl, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import RestaurantBookingIDLJson from "../idl/restaurant_booking.json";

// Program ID from your lib.rs
// const PROGRAM_ID = new PublicKey("76VgSQsavVMfDKdKx1Qy7tErvG9XWcYxq75pxi8Yy5ko");
const PROGRAM_ID = new PublicKey("FAogCJXF2mng8K1yYA35N4TxFMGeb8pDfV6D8ScfxFBZ");

export interface UserData {
  userPublicKey: string;
  restaurants: {
    [key: string]: {
      visitCount: number;
      dishes: {
        [key: string]: {
          name: string;
          count: number;
          pubkeys: string[];
        };
      };
    };
  };
}

export const getProgram = (connection: anchor.web3.Connection, wallet: anchor.Wallet) => {
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  // Normalize the IDL object by serializing and deserializing it.
  const normalizedIdlString = JSON.stringify(RestaurantBookingIDLJson);
  const idl: Idl = JSON.parse(normalizedIdlString) as Idl;
  return new Program(idl, PROGRAM_ID, provider);
};

export const findUserStatsPDA = (
  userPublicKey: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_stats"),
      userPublicKey.toBuffer(),
    ],
    programId
  );
};

export const findDishStatsPDA = (
  programId: PublicKey,
  dishName: string
): PublicKey => {
  const [pda, _bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("dish-stats"),
      Buffer.from(dishName),
    ],
    programId
  );
  return pda;
};

// PDA finder for the global Dish account
export const findGlobalDishPDA = (
  programId: PublicKey,
  dishName: string
): PublicKey => {
  const [pda, _bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("dish"), // Assuming "dish" is the seed for global dish accounts
      Buffer.from(dishName),
    ],
    programId
  );
  return pda;
};

export const fetchUserData = async (
  connection: anchor.web3.Connection,
  program: Program,
  userPublicKey: PublicKey
): Promise<UserData> => {
  const userData: UserData = {
    userPublicKey: userPublicKey.toBase58(),
    restaurants: {},
  };

  // Fetch user stats
  const userStatsAccounts = await connection.getProgramAccounts(program.programId, {
    filters: [
      { dataSize: 8 + 32 + 32 + 8 },
      { memcmp: { offset: 8, bytes: userPublicKey.toBase58() } },
    ],
  });

  // Fetch dish stats
  const dishStatsAccounts = await connection.getProgramAccounts(program.programId, {
    filters: [
      { dataSize: 8 + 32 + 32 + 8 + 4 + 50 },
      { memcmp: { offset: 8, bytes: userPublicKey.toBase58() } },
    ],
  });

  // Process user stats
  for (const account of userStatsAccounts) {
    try {
      const userStats = await program.account.userStats.fetch(account.pubkey);
      const restaurantKey = userStats.restaurant.toBase58();

      userData.restaurants[restaurantKey] = {
        visitCount: userStats.visitCount.toNumber(),
        dishes: {},
      };
    } catch (e) {
      console.error("Error decoding user stats:", e);
    }
  }

  // Process dish stats
  for (const account of dishStatsAccounts) {
    try {
      const dishStats = await program.account.dishStats.fetch(account.pubkey);
      const dishKey = dishStats.dish.toBase58();
      const restaurantKey = dishStats.user.toBase58(); // Using user as restaurant key for this example

      const nameLen = dishStats.nameLen || 0;
      const nameData = dishStats.nameData || [];
      const nameBytes = nameData.slice(0, nameLen);
      const dishName = Buffer.from(nameBytes).toString();

      if (!userData.restaurants[restaurantKey]) {
        userData.restaurants[restaurantKey] = {
          visitCount: 0,
          dishes: {},
        };
      }

      if (userData.restaurants[restaurantKey].dishes[dishName]) {
        userData.restaurants[restaurantKey].dishes[dishName].count +=
          dishStats.count.toNumber();
        userData.restaurants[restaurantKey].dishes[dishName].pubkeys.push(dishKey);
      } else {
        userData.restaurants[restaurantKey].dishes[dishName] = {
          name: dishName,
          count: dishStats.count.toNumber(),
          pubkeys: [dishKey],
        };
      }
    } catch (e) {
      console.error("Error decoding dish stats:", e);
    }
  }

  return userData;
};

export async function recordVisitOnChain(
  program: Program<RestaurantBooking>,
  restaurantName: string,
  selectedDish: { name: string; price: number } | null
) {
  if (!program.provider.wallet || !program.provider.wallet.publicKey) {
    console.error("Wallet not connected!");
    throw new Error("Wallet not connected!");
  }

  try {
    console.log("Recording visit on chain for restaurant:", restaurantName);
    const userPublicKey = program.provider.wallet.publicKey;
    const [userStatsPDA, _userStatsPDABump] = findUserStatsPDA(userPublicKey, program.programId);

    let dishStatsPDA: PublicKey | null = null;
    let globalDishPDA: PublicKey | null = null; // To store the PDA for the global Dish account

    if (selectedDish) {
      if (typeof selectedDish.name !== 'string' || selectedDish.name.trim() === '') {
        console.error(
          "Error in recordVisitOnChain: selectedDish.name is invalid or empty.",
          "Selected Dish Object:", selectedDish
        );
        throw new Error(
          "Selected dish name is invalid or empty. Cannot derive PDA or record visit for dish."
        );
      }
      dishStatsPDA = findDishStatsPDA(program.programId, selectedDish.name);
      globalDishPDA = findGlobalDishPDA(program.programId, selectedDish.name); // Calculate globalDishPDA
      console.log("Dish Name:", selectedDish.name, "Dish Stats PDA:", dishStatsPDA.toBase58());
      console.log("Global Dish PDA:", globalDishPDA.toBase58()); // Log it
    }

    // Check if user stats account exists
    let userStatsAccountInfo = await program.provider.connection.getAccountInfo(userStatsPDA);
    console.log("User Stats PDA:", userStatsPDA.toBase58(), "Account Info:", userStatsAccountInfo ? "Exists" : "Not found");

    // Step 1: Handle InitializeUserStats in a separate transaction if needed
    if (!userStatsAccountInfo) {
      console.log("User stats account not found. Attempting to initialize in a separate transaction using sendAndConfirm...");
      try {
        const initializeUserStatsTx = new Transaction();
        
        // Add compute budget instructions first
        initializeUserStatsTx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 80000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
        );
        
        const initializeUserStatsIx = await program.methods
          .initializeUserStats()
          .accounts({
            userStats: userStatsPDA,
            user: program.provider.wallet.publicKey, // Wallet PK is the user
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        initializeUserStatsTx.add(initializeUserStatsIx);

        // Set the fee payer for this specific transaction
        initializeUserStatsTx.feePayer = program.provider.wallet.publicKey;
        // Fetch a recent blockhash for this transaction
        const recentBlockhash = await program.provider.connection.getLatestBlockhash();
        initializeUserStatsTx.recentBlockhash = recentBlockhash.blockhash;

        // AnchorProvider's sendAndConfirm should use its internal wallet to sign 
        // if the transaction's feePayer is the wallet's public key.
        // No explicit signers array needed here usually.
        const initUserSig = await program.provider.sendAndConfirm(
          initializeUserStatsTx,
          [], // No additional keypair signers
          {
            commitment: "confirmed",
            skipPreflight: false, // Keep simulation enabled
            // lastValidBlockHeight: recentBlockhash.lastValidBlockHeight // Optional, sendAndConfirm might handle this
          }
        );

        console.log("InitializeUserStats transaction (via sendAndConfirm) successful, signature:", initUserSig);
        userStatsAccountInfo = await program.provider.connection.getAccountInfo(userStatsPDA);
        if (!userStatsAccountInfo) {
          throw new Error("UserStats account still not found after sendAndConfirm attempt.");
        }
        console.log("UserStats account confirmed to exist after sendAndConfirm initialization.");
      } catch (initError: any) {
        console.error("Error during separate InitializeUserStats transaction (sendAndConfirm):", initError);
        if (initError.logs) {
          console.error("InitializeUserStats (sendAndConfirm) transaction logs:", initError.logs);
        }
        let detailedErrorMessage = `Failed to initialize user stats (sendAndConfirm). Raw error: ${initError.message || JSON.stringify(initError)}`;
        if (initError.message && initError.message.includes("AccountNotSigner")){
            detailedErrorMessage = "AccountNotSigner error with sendAndConfirm. Check program/wallet setup.";
        } else if (initError.message && initError.message.includes("custom program error")){
            const errorCodeMatch = initError.message.match(/custom program error: (0x[0-9a-fA-F]+)/);
            detailedErrorMessage = `Program error ${errorCodeMatch ? errorCodeMatch[1] : ''} with sendAndConfirm. Check program logs.`;
        }
        throw new Error(detailedErrorMessage);
      }
    }

    // Step 2: Build the main transaction for dish stats and recording visit
    const mainTransaction = new Transaction()
      .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }))
      .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }));

    let dishStatsAccountInfo = null;
    if (selectedDish && dishStatsPDA && globalDishPDA) { // globalDishPDA check is important
      dishStatsAccountInfo = await program.provider.connection.getAccountInfo(dishStatsPDA);
      console.log("Dish Stats PDA:", dishStatsPDA.toBase58(), "Account Info for Dish Stats:", dishStatsAccountInfo ? "Exists" : "Not found");
      
      if (!dishStatsAccountInfo) {
        console.log("Dish stats account not found. Preparing InitializeDishStats instruction for dish:", selectedDish.name);
        const initializeDishStatsIx = await program.methods
          .initializeDishStats(selectedDish.name)
          .accounts({
            dishStats: dishStatsPDA,
            dish: globalDishPDA,
            user: userPublicKey, 
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        mainTransaction.add(initializeDishStatsIx);
        console.log("Added InitializeDishStats instruction to main transaction.");
      }
    }
    
    console.log("Preparing RecordVisit instruction for main transaction...");
    const recordVisitIx = await program.methods
      .recordVisit(restaurantName, selectedDish ? selectedDish.name : null, selectedDish ? new anchor.BN(selectedDish.price * 100) : null)
      .accounts({
        user: userPublicKey,
        userStats: userStatsPDA, // This account should now definitely exist
        dishStats: dishStatsPDA, 
        dish: globalDishPDA, 
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    mainTransaction.add(recordVisitIx);
    console.log("Added RecordVisit instruction to main transaction.");

    // Sign and send the main transaction
    mainTransaction.feePayer = userPublicKey;
    const latestBlockhash = await program.provider.connection.getLatestBlockhash("finalized");
    mainTransaction.recentBlockhash = latestBlockhash.blockhash;

    console.log("Main transaction fee payer:", mainTransaction.feePayer.toBase58());
    console.log("Main transaction recent blockhash:", mainTransaction.recentBlockhash);

    console.log("Requesting wallet to sign the main transaction...");
    const signedMainTx = await program.provider.wallet.signTransaction(mainTransaction);
    console.log("Main transaction signed by wallet.");

    console.log("Sending signed main transaction...");
    const mainTxSignature = await program.provider.connection.sendRawTransaction(
      signedMainTx.serialize(),
      {
        skipPreflight: false, 
        preflightCommitment: "finalized", 
      }
    );
    console.log("Main transaction sent, signature:", mainTxSignature);

    console.log("Confirming main transaction...");
    const mainConfirmation = await program.provider.connection.confirmTransaction(
      {
        signature: mainTxSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "finalized"
    );

    if (mainConfirmation.value.err) {
      console.error("Main transaction confirmation failed:", mainConfirmation.value.err);
      try {
        const failedTxInfo = await program.provider.connection.getTransaction(mainTxSignature, {commitment: "confirmed", maxSupportedTransactionVersion: 0});
        if (failedTxInfo && failedTxInfo.meta && failedTxInfo.meta.logMessages) {
          console.error("Main transaction logs:", failedTxInfo.meta.logMessages);
        }
      } catch (logError) {
        console.error("Failed to fetch main transaction logs:", logError);
      }
      throw new Error(`Main transaction confirmation failed: ${JSON.stringify(mainConfirmation.value.err)}`);
    }

    console.log("Main transaction successfully confirmed on-chain:", mainTxSignature);
    return mainTxSignature; // Return the signature of the main transaction

  } catch (error: any) {
    console.error("Error recording visit on chain (possibly multi-step process):", error);
    // Log additional details if it's a SendTransactionError
    if (error.name === 'SendTransactionError' || error.logs) {
      console.error("Transaction logs (if available):", error.logs);
    }
    // More detailed error logging for simulation failures
    if (error.message && error.message.includes("Transaction simulation failed")) {
        const match = error.message.match(/Logs:\s*(\[.*\])/s);
        if (match && match[1]) {
            try {
                const logs = JSON.parse(match[1].replace(/\\"/g, '"')); // Attempt to parse logs
                console.error("Detailed simulation logs:", logs);
            } catch (e) {
                console.error("Raw simulation logs string:", match[1]);
            }
        }
    }
    throw error; // Re-throw the error to be caught by the caller
  }
} 