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
  acceptedOffer: { 
    priceSpecification?: {
      price: number;
      priceCurrency?: string;
    },
    price: number; // The total price after including fees
    priceCurrency: string; // The currency of the total price after including fees
  }
  /* Uses partial properties from https://schema.org/OrderStatus */
  orderStatus: "OrderProcessing" | "OrderDelivered"
  /* Uses partial properties from https://schema.org/OrderItem */
  orderedItem?: {
    orderItemNumber?: string; // Fully qualified RecordID of the broker's AggregateOffer
    orderQuantity?: number; // Number of the Offer ordered
    /* Uses partial properties from https://schema.org/OrderStatus */
    orderItemStatus?: "OrderProcessing" | "OrderDelivered"
    /* Uses partial properties from https://schema.org/OrderItem */
    orderedItem?: {
      orderItemNumber: string; // Fully qualified RecordID of the seller's Offer
    }
  }[];
  /* Uses partial properties from https://schema.org/Person */
  customer: {
    identifier: string; // DID of the Customer or Agent
  };
  seller: Pick<Partner, 'identifier'>; // Seller of the Offer associated with the Order
  broker: Pick<Partner, 'identifier'>; // Partner the Order was made through, if applicable
}

/* Uses partial properties from https://schema.org/Organization */
export interface Partner {
  identifier: string; // DID of the Partner
  name: string; // Name of the Partner
  email?: string; // Contact by email of the Partner
}
