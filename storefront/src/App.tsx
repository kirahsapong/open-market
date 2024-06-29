import { useContext, useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button';
import { Web5Context } from './providers/Web5Provider';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { web5 } from './web5/web5.service';
import StoreProtocol from "./web5/store.json"; 
import { AggregateOffer, Offer, Store } from './web5/types';
import { Sidebar } from 'primereact/sidebar';


function App() {
  const { storeDetails, sellerDid, storeId } = useContext(Web5Context);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<(AggregateOffer & Offer & { imageUrl: string } & Store)[]>([]);
  const [cart, setCart] = useState<(AggregateOffer & Offer & { imageUrl: string } & Store)[]>([]);
  const [isVisibleRight, setIsVisibleRight] = useState(false);

  const total = useMemo(() => {
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
        from: sellerDid,
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "store/aggregateOffer",
            schema: StoreProtocol.types.aggregateOffer.schema
          }
        }
      })
      if (records && records.length) {
        console.log(records)
        const resolvedProducts: (AggregateOffer & Offer & { imageUrl: string } & Store)[] = []
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
          resolvedProducts.push({...resolvedAggregateProduct, ...resolvedOriginalProduct, imageUrl, ...resolvedSellerDetails})
        } 
        setProducts(resolvedProducts)
        console.log(resolvedProducts)
      }
      setIsLoading(false);
    }
    getProducts();
  },[storeDetails, sellerDid, storeId])

  const showSidebar = async () => {
    setIsVisibleRight(true);
  }

  const hideSidebar = () => {
    setIsVisibleRight(false);
  }

  const placeOrder = () => {
    hideSidebar();
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
                key={product.offers[0].identifier}
                title={product.itemOffered.name} 
                subTitle={`${product.priceSpecification.price} ${product.priceSpecification.priceCurrency}`} 
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
            {cart.map(cartItem => {
              return (
                <div className="cart-item" key={cartItem.offers[0].identifier}>
                  <div className="cart-item-image p-card-header">
                    <img src={cartItem.imageUrl} alt={cartItem.itemOffered.image.caption} />
                  </div>
                  <div className="cart-item-content">
                    <div className="cart-item-header">
                      <p><strong>{cartItem.itemOffered.name}</strong></p>
                      <p>{cartItem.priceSpecification.price}</p>
                    </div>
                    <div className="cart-item-body">
                      <small>sold by {cartItem.provider.name}</small>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    <p>{cartItem.priceSpecification.price}</p>
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
