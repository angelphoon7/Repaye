import React, { createContext, useContext, useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProgram, fetchUserData, UserData } from "../utils/solana";

interface SolanaContextType {
  connection: Connection | null;
  program: any | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextType>({
  connection: null,
  program: null,
  userData: null,
  loading: false,
  error: null,
  refreshUserData: async () => {},
});

export const useSolana = () => useContext(SolanaContext);

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [program, setProgram] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const conn = new Connection(process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com");
      setConnection(conn);
    }
  }, []);

  useEffect(() => {
    if (connection && publicKey && signTransaction && signAllTransactions) {
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      const prog = getProgram(connection, wallet);
      setProgram(prog);
    }
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const refreshUserData = async () => {
    if (!connection || !program || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchUserData(connection, program, publicKey);
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connection && program && publicKey) {
      refreshUserData();
    }
  }, [connection, program, publicKey]);

  return (
    <SolanaContext.Provider
      value={{
        connection,
        program,
        userData,
        loading,
        error,
        refreshUserData,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}; 