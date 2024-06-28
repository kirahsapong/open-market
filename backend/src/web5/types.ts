/* 
 * These types are partial representations of Schema.org types
 * and only include enough properties to support the minimum
 * functionality for OpenMarket. Types can be extended within
 * bounds of the associated Schema.org type.
*/

/* Uses partial properties from https://schema.org/WebSite */
export interface Store {
  url?: string; // URL of the store or marketplace
  headline?: string; // Headline for the store or marketplace
  description?: string; // Description for the store or marketplace
  provider: Partner // Provider of the store or marketplace
}

/* Uses partial properties from https://schema.org/Offer */
export interface Offer {
  inventoryLevel: string; // Inventory level of the associated Product
  /* Uses partial properties from https://schema.org/PriceSpecification */
  priceSpecification: {
    price: number; // Price for the Offer  
    priceCurrency: string; // Currency of the price for the associated Product 
  };
  seller: Partner; // Seller of the offer
  /* Uses partial properties from https://schema.org/Product */
  itemOffered: {
    name: string; // Name of the Product
    description: string; // Description of the Product
    /* Uses partial properties from https://schema.org/ImageObject */
    image: { 
      contentUrl: string; // URI of the image blob
      caption: string; // Alt text for the image
    },
    keywords: string // Delimited by commas, keywords for the Product
  }
}

/* Uses partial properties from https://schema.org/AggregateOffer */
export interface AggregateOffer {
  /* Uses partial properties from https://schema.org/PriceSpecification */
  priceSpecification: {
    price: number; // Final price after markup   
    priceCurrency: string; // Currency of the price
  };
  /* Uses partial properties from https://schema.org/Offer */
  offers: {
    seller: Pick<Partner, "identifier">;
    identifier: string; // Fully qualified RecordID of the original Offer; ie {parentId}/{recordId}
  }[]; 
}

/* Uses partial properties from https://schema.org/Order */
export interface Order {
  /* Uses partial properties from https://schema.org/OrderStatus */
  orderStatus: "OrderProcessing" | "OrderDelivered"
  /* Uses partial properties from https://schema.org/OrderItem */
  orderedItem: {
    orderItemNumber: string; // Fully qualified RecordID of the broker's AggregateOffer
    orderQuantity: number; // Number of the Offer ordered
    /* Uses partial properties from https://schema.org/OrderStatus */
    orderItemStatus: "OrderProcessing" | "OrderDelivered"
    /* Uses partial properties from https://schema.org/OrderItem */
    orderedItem: {
      orderItemNumber: string; // Fully qualified RecordID of the seller's Offer
    }
  }[];
  /* Uses partial properties from https://schema.org/Person */
  customer: {
    identifier: string; // DID of the Customer or Agent
  };
  seller: Partner; // Seller of the Offer associated with the Order
  broker: Partner; // Partner the Order was made through, if applicable
}

/* Uses partial properties from https://schema.org/Organization */
export interface Partner {
  identifier: string; // DID of the Partner
  name: string; // Name of the Partner
  email?: string; // Contact by email of the Partner
}

// broker first enters a DID of a seller and adds as Partner
// query Partners, query for Offers, filter by inventoryLevel > 0
// create an AggregateOffer, which should refer back to fully qualified DRL
// if DRL cannot be resolved, AggregateOffer not shown on frontend, indicated as error on backend
// a customer queries AggregateOffers from broker
// customer submits Order to broker, and subscribes
// broker submits Order to seller, and subscribes
// only seller should be able to update the order, and on update, write updates to broker and customer
// seller creates an offer, to join a marketplace they add themselves as a Partner

// marketplace opens, creates storefront
// seller discovers marketplace and gives the marketplace a role of Partner 
// an invite link creates that record when clicked and sends it to the Partner, then seller continues setting up
// only Partners can query and read Product and Offer
// ____ can ____ a Storefront
// __Anyone__ can __Query, Read__ an Offer -> query offers, then products, then write own offer marking up price
// __Anyone__ can __Query, Read__ an Offer/Product
// __Anyone__ can __Read__ an Offer/Product/Image
// __Anyone__ can __Create__ an Order, __Author, Recipient__ can __Query, Read__ an Order
// ____ can ____ a Storefront/Partner

// All parties should each have their own copy of the Order

// Order
// Product
// Product/Image
// Product/Offer
// Product/Offer/Image
// Offer
// Offer/Image
// Offer/Product
// Offer/Product/Image
// Storefront
// Storefront/Partner
// Partner
// Partner/Order
// 

// if an order comes through a partner, it should be written to the partner parent record
// else it should be written on its own
// a partner will write to its own parent record when it receives an offer

// you add a partner to a storefront. you can have many storefronts.
// you add all your inventory to your base protocol. you select inventory for a given storefront
// you add all orders to your base protocol. you use an ID to filter orders by store