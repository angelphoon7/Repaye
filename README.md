![image](https://github.com/user-attachments/assets/d2f6db68-357a-4931-9791-ae50e4b405bb)

**Repaye**✨

An application to deliver verifiable reviews and ratings based on on-chain user behavior and transactions.
________________________________________________________________________________________________________

**Problem Statement**❔
1. Reviews on major platforms such as Google Reviews and Instagram often lack authenticity.
 Users may be influenced by platform algorithms that prioritize certain content, leading to biased visibility. Moreover, some individuals or businesses go as far as purchasing followers or 
 engagement to manipulate public perception, thereby compromising the reliability and integrity of user-generated reviews.

2. Shoppers deliberately remove negative reviews and retain only those that portray them in a favorable light. 
 This selective curation of feedback is often done to maintain a positive public image and influence potential customers. By showcasing only beneficial reviews, they create a misleading 
 representation of their products or services. This manipulation not only distorts consumer trust and decision-making but also artificially inflates overall ratings, giving an inaccurate 
 impression of quality and customer satisfaction.
_______________________________________________________________________________________________________

**Solution**💥

![image](https://github.com/user-attachments/assets/f68c6027-4588-4eae-ad4e-1a625bb4ff54)

We formulated an algorithm to enhance the accuracy of rating analysis and filtering with the objective of identifying the most reliable and high-performing establishments.
The data utilized in this algorithm are stored on-chain, ensuring transparency, immutability and secure access for all relevant computations and analyses.

1. Food preference :

   Analyze food preferences of user by examining their transaction history, as their purchasing patterns provide valuable insights into their dietary habits and preferred cuisines.

2. Visiting frequency :

   Users with higher visiting frequency are considered to provide more reliable and trustworthy reviews, as their feedback is based on consistent and repeated experiences.
   
3. Service Performance :
   
   Customers also take the quality of service into account. Even if the food is excellent, impolite or unprofessional behavior from the staff can negatively impact the overall dining experience, 
   potentially discouraging users from returning in the future.
   
4. Spending amount :
   
    Customers who spend larger amounts at a store typically have greater experience with its offerings, which enables them to provide more informed and credible ratings. Their higher level of 
    engagement suggests a deeper understanding of the product or service quality, making their feedback particularly valuable for accurately assessing the establishment.
   
5.  Confidence level :
   
    The confidence level reflects the complexity and authenticity of the comments provided by users. For example, if a user repeatedly posts simplistic or redundant remarks such as "nice, nice, 
    nice," the algorithm, through AI analysis, will identify and filter out such repetitive content. This ensures that only meaningful and substantive feedback contributes to the overall 
    evaluation, thereby enhancing the reliability and accuracy of the ratings.

_________________________________________________________________________________________________________
**HOW OUR PROJECT WORKS**🍴

Users start by selecting the date and time to book a restaurant reservation. Then they will choose the dishes they wish to order and proceed with the payment. Only after completing the payment can users submit reviews and ratings. Additionally, users are allowed to submit a rating only once per day to ensure fairness and preventing multiple reviews within the same day.




__________________________________________________________________________________________________________
**ARCHITECTURE DIAGRAM**

![image](https://github.com/user-attachments/assets/4c5b625d-446b-44b8-8c02-a9ddba623757)



## To Start

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

