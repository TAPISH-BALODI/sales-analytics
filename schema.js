const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type CustomerSpending {
    customerId: ID!
    totalSpent: Float!
    averageOrderValue: Float!
    lastOrderDate: String!
  }

  type TopProduct {
    productId: ID!
    name: String!
    totalSold: Int!
  }

  type CategoryRevenue {
    category: String!
    revenue: Float!
  }

  type SalesAnalytics {
    totalRevenue: Float!
    completedOrders: Int!
    categoryBreakdown: [CategoryRevenue!]!
  }

  type Product {
    productId: String!
    quantity: Int!
    price: Float!
  }

  type OrderProduct {
    productId: String!
    quantity: Int!
    priceAtPurchase: Float!
  }

  type Order {
    customerId: String!
    products: [OrderProduct!]!
    totalAmount: Float!
    orderDate: String!
    status: String!
  }

 
  type PaginatedOrders {
    orders: [Order!]!
    totalPages: Int!
    currentPage: Int!
  }

  type Query {
    getCustomerSpending(customerId: String!): CustomerSpending
    getTopSellingProducts(limit: Int!): [TopProduct!]!
    getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
    getCustomerOrders(customerId: String!, page: Int!, limit: Int!): PaginatedOrders!
  }

  input OrderProductInput {
    productId: String!
    quantity: Int!
  }

  type Mutation {
    placeOrder(customerId: String!, products: [OrderProductInput!]!): Order
  }
`;

module.exports = typeDefs;
