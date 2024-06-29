import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'primereact/button';
import { Web5Context } from './providers/Web5Provider';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { did, web5 } from './web5/web5.service';
import StoreProtocol from "./web5/store.json"; 
import { AggregateOffer, Offer, Order, Store } from './web5/types';
import { Sidebar } from 'primereact/sidebar';
import { Toast } from 'primereact/toast';


function App() {
  const { storeDetails, storeDid, storeId } = useContext(Web5Context);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<({aggregateProduct: AggregateOffer} & Offer & { imageUrl: string } & Store)[]>([]);
  const [cart, setCart] = useState<({aggregateProduct: AggregateOffer} & Offer & { imageUrl: string } & Store)[]>([]);
  const [isVisibleRight, setIsVisibleRight] = useState(false);
  const toast = useRef<Toast>(null);

  const total = useMemo(() => {
    return cart.reduce((sum, cartItem) => {
      return sum + Number(cartItem.aggregateProduct.priceSpecification.price);
    }, 0);
  }, [cart]);

  const baseTotal = useMemo(() => {
    return cart.reduce((sum, cartItem) => {
      return sum + Number(cartItem.priceSpecification.price);
    }, 0);
  }, [cart]);

  useEffect(() => {
    setIsLoading(true);
    if (!storeDetails?.provider.name) {
      return
    }
    const getProducts = async () => {
      const { records } = await web5.dwn.records.query({
        from: storeDid,
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "store/aggregateOffer",
            schema: StoreProtocol.types.aggregateOffer.schema
          }
        }
      })
      if (records && records.length) {
        const resolvedProducts: ({aggregateProduct: AggregateOffer} & Offer & { imageUrl: string } & Store)[] = []
        for (const record of records) {
          const resolvedAggregateProduct = await record.data.json()
          const { record: originalRecord } = await  web5.dwn.records.read({
            from: resolvedAggregateProduct.offers[0].seller.identifier,
            message: {
              filter: {
                recordId: resolvedAggregateProduct.offers[0].identifier
              }
            }
          })
          const resolvedOriginalProduct = await originalRecord.data.json();
          const { record: imageRecord } = await  web5.dwn.records.read({
            from: resolvedAggregateProduct.offers[0].seller.identifier,
            message: {
              filter: {
                protocol: StoreProtocol.protocol,
                protocolPath: 'offer/image',
                parentId: originalRecord.id
              }
            }
          })
          const blob = await imageRecord.data.blob();
          const imageUrl = URL.createObjectURL(blob);
          const { records: sellerStoreRecords } = await web5.dwn.records.query({
            from: resolvedAggregateProduct.offers[0].seller.identifier,
            message: {
              filter: {
                protocol: StoreProtocol.protocol,
                protocolPath: 'store',
              }
            }
          });
          const resolvedSellerDetails = await sellerStoreRecords?.[0].data.json();
          resolvedProducts.push({aggregateProduct: resolvedAggregateProduct, ...resolvedOriginalProduct, imageUrl, ...resolvedSellerDetails})
        } 
        setProducts(resolvedProducts)
      }
      setIsLoading(false);
    }
    getProducts();
  },[storeDetails, storeDid, storeId])

  const showSidebar = async () => {
    setIsVisibleRight(true);
  }

  const hideSidebar = () => {
    setIsVisibleRight(false);
  }

  const placeOrder = async () => {
    const order: Partial<Order> = {
      acceptedOffer: {
        price: total,
        priceCurrency: cart[0].aggregateProduct.priceSpecification.priceCurrency,
        priceSpecification: {
          price: baseTotal
        }
      },
      orderStatus: "OrderProcessing",
      customer: {
        identifier: did
      },
      seller: {
        identifier: cart[0].seller.identifier
      },
      broker: {
        identifier: storeDid
      }
    }
    const { record } = await web5.dwn.records.create({
      data: order,
      message: {
        recipient: storeDid,
        protocol: StoreProtocol.protocol,
        protocolPath: 'order',
        schema: StoreProtocol.types.order.schema
      },
      store: false
    });
    if (record) {
      const { status } = await record.send(storeDid);
      console.log(status)
      showSuccess()
      setCart([]);
    } else {
      showError();
    }
    hideSidebar();
  }

  const showError = () => {
    toast.current?.show({severity:'error', summary: 'Error', detail: 'Could not place order', life: 3000});
  }

  const showSuccess = () => {
    toast.current?.show({severity:'success', summary: 'Success', detail: 'Order placed', life: 3000});
  }

  if (isLoading) {
    return (
      <div className="loading">
        <ProgressSpinner />
      </div>
    )
  }

  return (
    <>
      <Toast ref={toast} />
      <header>
        <div>{storeDetails?.provider.name ?? "My Store"}</div>
        <div><Button link label={`cart${cart.length > 0 ? ` (${cart.length})` : ''}`} onClick={showSidebar}/></div>
      </header>
      <main>
        <h1>{storeDetails?.headline ?? "Welcome"}</h1>
        <p className="subheading">{storeDetails?.description ?? "This is just a template for now"}</p>
        <section>
          {products.map(product => {
            return (
              <Card 
                key={product.aggregateProduct.offers[0].identifier}
                title={product.itemOffered.name} 
                subTitle={`${product.aggregateProduct.priceSpecification.price} ${product.aggregateProduct.priceSpecification.priceCurrency}`} 
                footer={<Button label={cart.includes(product) ? "Added" : "Add to cart"} onClick={() => setCart([...cart, product])} />}
                header={<img src={product.imageUrl} alt={product.itemOffered.image.caption} />} 
              >
                <small>sold by {product.provider.name}</small>
                <p>{product.itemOffered.description}</p>
              </Card>
            )
          })}
        </section>
        <Sidebar 
          header={<h2>Cart</h2>} 
          visible={isVisibleRight} 
          style={{ maxWidth: '100%', width: '680px' }} 
          position="right" 
          onHide={hideSidebar}
        >   
        {cart.length ? (
          <>
            {cart.map((cartItem, i) => {
              return (
                <div className="cart-item" key={`${cartItem.aggregateProduct.offers[0].identifier}-${i}`}>
                  <div className="cart-item-image p-card-header">
                    <img src={cartItem.imageUrl} alt={cartItem.itemOffered.image.caption} />
                  </div>
                  <div className="cart-item-content">
                    <div className="cart-item-header">
                      <p><strong>{cartItem.itemOffered.name}</strong></p>
                    </div>
                    <div className="cart-item-body">
                      <small>sold by {cartItem.provider.name}</small>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    <p>{cartItem.aggregateProduct.priceSpecification.price}</p>
                  </div>
                </div>
              )
            })}
            <div className="cart-total">
              <p><strong>Total</strong></p>
              <p><strong>{total.toFixed(2)}</strong></p>
            </div>
            <div className="cart-button">
              <Button label="Place order" onClick={placeOrder} />
            </div>
          </>
        ) : (
          <p>Nothing in cart</p>
        )}
          
        </Sidebar>
      </main>
    </>
  )
}

export default App
