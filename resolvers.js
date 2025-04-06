const Order = require('./models/Orders');
const Customer = require('./models/Customer');
const Product = require('./models/Products');
const redis = require('redis');
const client = redis.createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379
  }
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await client.connect();
  // Your Redis operations here
})();
//THIS IS FOR CONVERTING PRODUCTS STRING TO ARRAY OJECT

// const convertProductsObject = (obj) => {
//   // Get numeric keys, sorted

//   const temp= obj
  
//   console.log("Object:",temp );
//   const keys = Object.keys(obj).filter(key => !isNaN(key)).sort((a, b) => a - b);
//   // Join them to form a single string
//   console.log("Keys:", keys);
//   const joinedString = keys.map(key => obj[key]).join('');
//   // Replace single quotes with double quotes
//   const fixedString = joinedString.replace(/'/g, '"');
  
//   let productsArray = [];
//   try {
//     productsArray =  fixedString;
//   } catch (error) {
//     console.error("Error parsing JSON:", error);
//   }
  
//   return { products: productsArray, _id: obj._id };
// };
// async function preProcessOrders() {
//   try {
//     const orders = await Order.find({ products: { $type: "string" } });
//     if (!orders.length) return;

//     const bulkOps = orders.map(order => {
//       const products = order.products;
//       let parsed;
 
//       for (let prod in products) {
        
//         let temp = JSON.stringify(products[prod]);

//         const regex = /"(\d+)":"(.*?)"/g;
//         let match;
//         const parts = [];

       
//         while ((match = regex.exec(temp)) !== null) {
//           parts.push({ index: Number(match[1]), value: match[2] });
//         }

//         const finalString = parts
//           .sort((a, b) => a.index - b.index)
//           .map(part => part.value)
//           .join('');

         
//         try {
//           parsed = JSON.parse(finalString.replaceAll(/'/g, '"'));
//         } catch (e) {
//           parsed = [];
//         }
//       }

//       return {
//         updateOne: {
//           filter: { _id: order._id },
         
//           update: { $set: { products: parsed } }
//         }
//       };
//     });

//     if (bulkOps.length > 0) {
      
//       await Order.bulkWrite(bulkOps);
//       console.log("Pre-processing complete: Updated orders with parsed products.");
//     }
//   } catch (error) {
//     console.error("Error in preProcessOrders:", error);
//   }
// }


//  preProcessOrders() 
 
const resolvers = {
  Query: {
     
    getCustomerSpending: async (_, { customerId }) => {
      console.log("Fetching customer spending for:", customerId);
        try {
           

          
            const result = await Order.aggregate([
              { $match: { customerId: customerId} },
              { $sort: { orderDate: -1 } },
              {
                $group: {
                  _id: "$customerId",
                  totalSpent: { $sum: "$totalAmount" },
                  averageOrderValue: { $avg: "$totalAmount" },
                  lastOrderDate: { $first: "$orderDate" }
                }
              }
            ]).exec();
    
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

        getTopSellingProducts: async (_, { limit }) => {
          try {
            const results = await Order.aggregate([
              { $unwind: "$products" },
              {
                $group: {
                  _id: "$products.productId",
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
            console.log("Top selling products:", results);
            
            return results;
          } catch (error) {
            console.error("Error in getTopSellingProducts:", error);
            throw new Error("Failed to fetch top selling products.");
          }
        },

        getSalesAnalytics: async (_, { startDate, endDate }) => {
          try {
            const cacheKey = `sales-analytics:${startDate}:${endDate}`;
            const cachedData = await client?.get(cacheKey) ||null;
        
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
                      $lookup: {
                        from: "products",
                        localField: "products.productId",  
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
            const revenueData =
              (facetResult.revenueAndOrders && facetResult.revenueAndOrders[0]) || { totalRevenue: 0, completedOrders: 0 };
        
            // Use client consistently for caching
            await client?.set(cacheKey, JSON.stringify({
              totalRevenue: revenueData.totalRevenue,
              completedOrders: revenueData.completedOrders,
              categoryBreakdown: facetResult.categoryBreakdown || []
            }), "EX", 600);
        
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
,        
    getCustomerOrders: async (_, { customerId, page, limit }) => {
      try {
        console.log("Fetching orders for customer:", customerId);
        
        const skip = (page - 1) * limit;
        
        const total = await Order.countDocuments({ customerId });
        console.log("Fetched orders count:", total);
        
      
        const orders = await Order.find({ customerId })
          .sort({ orderDate: -1 })
          .skip(skip)
          .limit(limit);
        console.log("Fetched orders:", orders);
  
        
        return {
          orders,
          totalPages: Math.ceil(total / limit),
          currentPage: page
        };
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        throw new Error("Failed to fetch customer orders.");
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
        return savedOrder;
      } catch (error) {
        console.error("Error placing order:", error);
        throw new Error("Failed to place order.");
      }
    }
  }
,
};

module.exports = resolvers;
