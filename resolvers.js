const Order = require('./models/Orders');
const Customer = require('./models/Customer');
const Product = require('./models/Products');
 
const Redis = require("ioredis");
const redis = new Redis();

const { UUID } = require("bson");
 
 

 
const resolvers = {
  Query: {
     
    getCustomerSpending: async (_, { customerId }) => {
  
        try {
           
    
          
            const binaryUUID = new UUID(customerId);
          
    
          
            const result = await Order.aggregate([
              { $match: { customerId: binaryUUID } },
              { $sort: { orderDate: -1 } },
              {
                $group: {
                  _id: "$customerId",
                  totalSpent: { $sum: "$totalAmount" },
                  averageOrderValue: { $avg: "$totalAmount" },
                  lastOrderDate: { $first: "$orderDate" }
                }
              }
            ]);
    
            console.log("Aggregation result:", result);
    
            if (!result.length) return null;
    
            return {
              customerId,
              totalSpent: result[0].totalSpent,
              averageOrderValue: result[0].averageOrderValue,
              lastOrderDate: result[0].lastOrderDate
            };
          } catch (error) {
            console.error("Error in getCustomerSpending:", error);
            throw new Error("Failed to fetch customer spending.");
          }
        },

 
        getTopSellingProducts: async (_, { limit }) => {
          try {
            
     
            const results = await Order.aggregate([
              { $unwind: "$products" },
              {
                $addFields: {
                  "products.uuidProductId": { $toUUID: "$products.productId" }
                }
              },
              {
                $group: {
                  _id: "$products.uuidProductId",
                  totalSold: { $sum: "$products.quantity" }
                }
              },
              { $sort: { totalSold: -1 } },
              { $limit: limit },
              {
                $lookup: {
                  from: "products",
                  localField: "_id",        
                  foreignField: "_id",      
                  as: "productDetails"
                }
              },
              { $unwind: "$productDetails" },
              {
                $project: {
                  productId: "$_id",
                  name: "$productDetails.name",
                  totalSold: 1
                }
              }
            ]);
            
            return results
          } catch (error) {
            console.error("Error in getTopSellingProducts:", error);
            throw new Error("Failed to fetch top selling products.");
          }
        },

    getSalesAnalytics: async (_, { startDate, endDate }) => {
      try {

        const cacheKey = `sales-analytics:${startDate}:${endDate}`;

        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
          console.log("Returning cached analytics");
          return JSON.parse(cachedData);
        }
        const results = await Order.aggregate([
          
          { $addFields: { orderDate: { $toDate: "$orderDate" } } },
       
          { 
            $match: { 
              orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) } 
            } 
          },
          {
            $facet: {
             
              revenueAndOrders: [
                {
                  $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    completedOrders: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
                  }
                }
              ],
             
              categoryBreakdown: [
                
                { $unwind: "$products" },
             
                { 
                  $addFields: { 
                    "products.uuidProductId": { $toUUID: "$products.productId" } 
                  } 
                },
             
                {
                  $lookup: {
                    from: "products",
                    localField: "products.uuidProductId",
                    foreignField: "_id",
                    as: "productDetails"
                  }
                },
                { $unwind: "$productDetails" },
              
                {
                  $group: {
                    _id: "$productDetails.category",
                    revenue: { $sum: { $multiply: ["$products.quantity", "$products.priceAtPurchase"] } }
                  }
                },
                 
                {
                  $project: {
                    _id: 0,
                    category: "$_id",
                    revenue: 1
                  }
                }
              ]
            }
          }
        ]);
        
    
        const facetResult = results[0] || {};
        const revenueData = (facetResult.revenueAndOrders && facetResult.revenueAndOrders[0]) || { totalRevenue: 0, completedOrders: 0 };
        await redis.set(cacheKey, JSON.stringify(results), "EX", 600);
        return {
          totalRevenue: revenueData.totalRevenue,
          completedOrders: revenueData.completedOrders,
          categoryBreakdown: facetResult.categoryBreakdown || []
        };
        
      } catch (error) {
        console.error("Error in getSalesAnalytics:", error);
        throw new Error("Failed to fetch sales analytics.");
      }
    }
    
  },
  Mutation: {
  placeOrder: async (_, { customerId, products }) => {
    try {
       

      let totalAmount = 0;
      const orderProducts = [];

      
      for (const prodInput of products) {
       
        const product = await Product.findOne({ productId: prodInput.productId });
        if (!product) {
          throw new Error(`Product ${prodInput.productId} not found.`);
        }
     
        const priceAtPurchase = product.price;
        totalAmount += priceAtPurchase * prodInput.quantity;

        orderProducts.push({
          productId: prodInput.productId,
          quantity: prodInput.quantity,
          priceAtPurchase
        });
      }

     
      const newOrder = new Order({
        customerId,
        products: orderProducts,
        totalAmount,
        orderDate: new Date().toISOString(),
        status: "pending"  
      });

      const savedOrder = await newOrder.save();
      // invalidate cache when a new order is placed
      await redis.del(`sales-analytics:*`);
      return savedOrder;
    } catch (error) {
      console.error("Error placing order:", error);
      throw new Error("Failed to place order.");
    }
   } }
,
};

module.exports = resolvers;
