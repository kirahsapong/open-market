import { Button } from "primereact/button"
import { Column } from "primereact/column"
import { DataTable } from "primereact/datatable"
import { Toast } from "primereact/toast"
import { useState, useRef, FormEvent, useEffect } from "react"
import { type Record } from "@web5/api";
import { AggregateOffer, Offer, Partner } from "../web5/types"
import { Dialog } from "primereact/dialog"
import { did, web5 } from "../web5/web5.service"
import StoreProtocol from "../web5/store.json"; 
import { useGuard } from "../hooks/useGuard"
import { Sidebar } from "primereact/sidebar"
import { InputText } from "primereact/inputtext"
import { InputNumber } from "primereact/inputnumber"
import { AutoComplete } from "primereact/autocomplete"
import { FileUpload } from "primereact/fileupload"


const Products = () => {
  const { storeId } = useGuard();
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleRight, setIsVisibleRight] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Partial<AggregateOffer & Offer & Record>[]>([]);
  const [offers, setOffers] = useState<Partial<Offer & Record>[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<Partial<Offer & Record>[]>([]);
  const toast = useRef<Toast>(null);
  const [currencies, setCurrencies] = useState(['USD', 'BTC', 'AUS', 'CAD'])
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>()

  useEffect(() => {
    setIsFetching(true)
    const checkProducts = async () => {
      const { records } = await getAggregateOffers();
      if (records && records.length) {
        const resolvedData: Partial<Offer & AggregateOffer & Record> [] = []
        for (const record of records) {
          const data = await record.data.json();
          const partnerStore = await getPartnerStore(data.offers[0].seller.identifier);
          const { record: partnerRecord } = await web5.dwn.records.read({
            from: data.offers[0].seller.identifier,
            message: {
              filter: {
                recordId: data.offers[0].identifier
              }
            }
          })
          
          const resolvedProduct = {
            aggregatePrice: data.priceSpecification,
            ...data,
            ...partnerStore,
            ...partnerRecord,
            ...(await partnerRecord.data.json()),
          }
          resolvedData.push(resolvedProduct);
        }
        setProducts(resolvedData) 
        console.log(resolvedData)
      }
    }

    checkProducts()
    setIsFetching(false);
  }, [isLoading])

  const getAggregateOffers = async () => {
    const { records } = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store/aggregateOffer",
          schema: StoreProtocol.types.aggregateOffer.schema
        }
      },
    })
    return { records }
  }

  const getPartnerStore = async (sellerDid: string) => {
    const { records } = await web5.dwn.records.query({
      from: sellerDid,
      message: {
        filter: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store",
          schema: StoreProtocol.types.store.schema
        }
      },
    })
    if (records && records[0]) {
      const data = await records[0].data.json();
      return data
    }
  }

  const getPartners = async () => {
    const partners: Partner[] = [];
    const { records } = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store/partner",
          schema: StoreProtocol.types.partner.schema
        }
      }
    })
    if (records) {
      for (const record of records) {
        partners.push(await record.data.json());
      }
    }
    return partners
  }

  const getProviderOffers = async (sellerDid: string) => {
    const offers: Offer[] = [];
    const { records } = await web5.dwn.records.query({
      from: sellerDid,
      message: {
        filter: {
          protocol: StoreProtocol.protocol,
          protocolPath: "offer",
          schema: StoreProtocol.types.offer.schema
        }
      }
    })
    if (records) {
      for (const record of records) {
        offers.push({...await record.data.json(), ...record});
      }
    }
    return offers
  }

  const addPartnerOffer = async () => {
    let hasError = false;
    let hasSuccess = false;

    for (const offer of selectedOffers) {
      const offerId = offer.id ?? (offer as Record)["_recordId"];
      // Product exists already, do nothing
      const existingOffers = products.filter(product => product.offers?.[0].identifier == offer.id);
      if (existingOffers.length) { 
        continue;
      }
      // Otherwise, add the offer

      const { record } = await web5.dwn.records.create({
        data: {
          priceSpecification: {
            price: offer.priceSpecification?.price ? (offer.priceSpecification?.price * 1.1).toFixed(2) : undefined,
            priceCurrency: offer.priceSpecification?.priceCurrency
          },
          offers: [{
            seller: {
              identifier: offer.seller?.identifier
            },
            identifier: offerId
          }]
        },
        message: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store/aggregateOffer",
          parentContextId: storeId,
          schema: StoreProtocol.types.aggregateOffer.schema,
          published: true
        },
      })
      if (record) {
        await record.send()
        hasSuccess = true;
      } else {
        hasError = true;
      }
    }
    return { hasError, hasSuccess }
  }

  
  //TODO: Implement remove partner offer
  const handleSavePartnerOffer = async () => {
    setIsLoading(true);
    const { hasError: hasAddError, hasSuccess: hasAddSuccess } = await addPartnerOffer()
    setIsLoading(false);
    if (hasAddError) {
      showError('Error adding some offers')
    }
    if (hasAddSuccess ) {
      showSuccess('Saved successfully')
      hideSidebar()
    }
  }

  const addProduct = async (e: FormEvent<HTMLFormElement>) => {
    let hasError = false;
    const formData = new FormData(e.target as HTMLFormElement);
    const entries = Object.fromEntries(formData.entries());
    const { record } = await web5.dwn.records.create({
      data: {
        inventoryLevel : entries.inventory,
        priceSpecification: {
          price: entries.price,
          priceCurrency: entries.priceCurrency
        },
        seller: {
          identifier: did,
        },
        itemOffered: {
          name: entries.name,
          description: entries.description,
          image: {
            caption: entries.caption
          }
        }
      },
      message: {
        protocol: StoreProtocol.protocol,
        protocolPath: "offer",
        schema: StoreProtocol.types.offer.schema,
        published: true
      },
    })
    if (record) {
      await record.send()
      if (selectedFiles) {
        const blob = new Blob([selectedFiles[0]], { type: selectedFiles[0].type });
        const { record: imageRecord } = await web5.dwn.records.create({
          data: blob,
          message: {
            protocol: StoreProtocol.protocol,
            protocolPath: "offer/image",
            parentContextId: record?.contextId,
            published: true
          },
        });
        await imageRecord?.send();
      }
    } else {
      hasError = true;
    }
    return hasError
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const hasError = await addProduct(e);
    setIsLoading(false);
    if (hasError) {
      showError('Could not add product')
    } else {
      showSuccess('Added product')
      hideDialog()
    }
  }

  const showError = (detail: string) => {
    toast.current?.show({severity:'error', summary: 'Error', detail, life: 3000});
  }

  const showSuccess = (detail: string) => {
    toast.current?.show({severity:'success', summary: 'Success', detail, life: 3000});
  }

  const showSidebar = async () => {
    setIsFinding(true);
    const allOffers: (Offer & Record)[] = []
    const partners = await getPartners();
    for (const partner of partners) {
      const offers = await getProviderOffers(partner.identifier);
      const store = await getPartnerStore(partner.identifier);
      allOffers.push(...offers.map(offer => { return { ...offer, ...store }}))
    }
    
    setOffers(allOffers)
    const selectedFromProducts = []
    for (const product of products) {
      const filteredOffers = allOffers.filter(offer => (offer.id ?? (offer as Record)["_recordId"]) == (product.id ?? (product as Record)["_recordId"]));
      selectedFromProducts.push(...filteredOffers);
    }
    setSelectedOffers(selectedFromProducts);
    setIsFinding(false);
    setIsVisibleRight(true);
  }

  const hideSidebar = () => {
    setIsVisibleRight(false);
  }

  const showDialog = async () => {
    setIsVisible(true);
  }

  const hideDialog = () => {
    setSelectedCurrency('');
    setIsVisible(false);
  }

  return (
    <div id="products">
      <Toast ref={toast} />
      <div className="header">
        <h1>Manage products</h1>
        <p>Manage products on your store or for your marketplace</p>
        <div className="buttons">
          <Button label="Add product" onClick={showDialog}/>
          <Button link label="Find products" onClick={showSidebar} loading={isFinding}/>
        </div>
      </div>
      <DataTable 
        value={products} 
        paginator rows={5} 
        rowsPerPageOptions={[5, 10, 25, 50]} 
        loading={isFetching}
        emptyMessage={"No products to display"}
      >
        <Column field="itemOffered.name" header="Name"></Column>
        <Column field="itemOffered.description" header="Description"></Column>
        <Column field="priceSpecification.price" header="Base Price"></Column>
        <Column field="aggregatePrice.price" header="Your Price"></Column>
        <Column field="priceSpecification.priceCurrency" header="Currency"></Column>
        <Column field="provider.name" header="Seller"></Column>
        <Column field="inventoryLevel" header="Inventory"></Column>
      </DataTable>
      <Sidebar 
        header={<h2>Find products</h2>} 
        visible={isVisibleRight} 
        style={{ maxWidth: '100%', width: '880px' }} 
        position="right" 
        onHide={hideSidebar}
      >   
        <h3>Select from available products from partners</h3>         
        <p>Populate your marketplace with products from partners.</p>
        <DataTable 
          value={offers} 
          paginator rows={5} 
          rowsPerPageOptions={[5, 10, 25, 50]} 
          loading={isFinding}
          emptyMessage={"No offers to display"}
          selection={selectedOffers} 
          onSelectionChange={(e) => setSelectedOffers(e.value)} 
          selectionMode={null} 
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column field="itemOffered.name" header="Name"></Column>
          <Column field="itemOffered.description" header="Description"></Column>
          <Column field="priceSpecification.price" header="Cost"></Column>
          <Column field="priceSpecification.priceCurrency" header="Currency"></Column>
          <Column field="provider.name" header="Seller"></Column>
          <Column field="inventoryLevel" header="Inventory"></Column>
        </DataTable>
        <div className="buttons">
          <Button label="Save and done" loading={isLoading} onClick={handleSavePartnerOffer} />
        </div>
      </Sidebar>
      <Dialog header={"Add product"} visible={isVisible} style={{ width: '640px' }} onHide={hideDialog}>
        <p>Add a product to make it available to marketplaces</p>
        <h2>Product details</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <InputText 
              name="name"
              placeholder="Product name"
              aria-label="Product name"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <InputText 
              name="description"
              placeholder="Product description"
              aria-label="Product description"
              autoComplete="off"
            />
          </div>
          <div className="field fields">
            <InputNumber 
              name="price"
              placeholder="Product price"
              aria-label="Product price"
              minFractionDigits={2}
            />
            <AutoComplete 
              value={selectedCurrency}
              onChange={e => setSelectedCurrency(e.value)}
              name="priceCurrency"
              placeholder="Currency"
              aria-label="Product price currency"
              autoComplete="off"
              suggestions={currencies} 
              completeMethod={(e) => {
                setCurrencies(['AUS', 'BTC', 'CAD', 'USD'].filter(item => item.includes(e.query.toUpperCase())) )
              }}
            />
          </div>
          <div className="field">
            <InputNumber 
              name="inventory"
              placeholder="Inventory in stock"
              aria-label="Product inventory level"
            />
          </div>
          <h2>Add an image</h2>
          <div className="field">
            <FileUpload 
              mode="basic" 
              accept="image/png, image/jpeg" 
              maxFileSize={1000000} 
              uploadHandler={() => null} 
              onSelect={(e) => setSelectedFiles(e.files)}
              customUpload
            />
            <InputText 
              name="caption"
              placeholder="Alternative text"
              aria-label="Product image alternative text"
              autoComplete="off"
              aria-describedby="caption-help"
            />
            <small id="caption-help">
              Describe the image for customers with disabilities
            </small>
          </div>
          <div className="buttons">
            <Button label="Add product" loading={isLoading} />
          </div>
        </form>
      </Dialog>
      
    </div>
  )
}

export default Products