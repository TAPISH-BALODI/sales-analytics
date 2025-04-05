Sales Analytics GraphQL API
Overview
The Sales Analytics GraphQL API provides endpoints to analyze sales data, including customer spending, top-selling products, and overall sales performance.

Product Performance: Identify top-selling products.​

Sales Analytics: Access data on total revenue and completed orders.​


Installation
Clone the Repository:

 
git clone https://github.com/yourusername/sales-analytics-api.git
Navigate to the Project Directory:

 
cd sales-analytics-api
Install Dependencies:
 
npm install
Set Up Environment Variables:

Create a .env file in the root directory with the following variables:

MONGO_URI=your_mongodb_connection_string
PORT=your_preferred_port ; I have set 4000
Usage
Start the Server:

 
npm run dev
Access the GraphQL Playground:

Navigate to http://localhost:4000/graphql to interact with the API.

API Endpoints
getCustomerSpending: Retrieve spending details for a specific customer.​

getTopSellingProducts: Fetch a list of top-selling products.​

getSalesAnalytics: Obtain sales analytics data within a specified date range.​

 Added redis Cache as well for reading analytics faster; also they are invalidated on new entry of product in mutation

License
This project is licensed under the MIT License
