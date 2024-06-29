import { Column } from "primereact/column"
import { DataTable } from "primereact/datatable"
import { Toast } from "primereact/toast"
import { useState, useRef, useEffect } from "react"
import { AggregateOffer, Offer } from "../web5/types"
import { type Record } from "@web5/api";
import { did, web5 } from "../web5/web5.service"
import StoreProtocol from "../web5/store.json"; 


const Orders = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [orders, setOrders] = useState<Partial<AggregateOffer & Offer & Record>[]>([]);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    setIsFetching(true)
    const checkOrders = async () => {
      const { records } = await web5.dwn.records.query({
        from: did,
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "order",
            schema: StoreProtocol.types.order.schema
          }
        }
      })
      if (records && records.length) {
        const resolvedData = [];
        for (const record of records) {
          const order = await record.data.json();
          order.acceptedOffer.price = order.acceptedOffer.price.toFixed(2)
          order.acceptedOffer.priceSpecification.price = order.acceptedOffer.priceSpecification.price.toFixed(2)
          const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          };
          resolvedData.push({...order, ...record, dateCreated: new Date(record.dateCreated).toLocaleString('en-US', dateOptions).replace(',', '')});
        }
        setOrders(resolvedData)
      }
    }

    checkOrders()
    setIsFetching(false);
  }, [])

  return (
    <div id="orders">
      <Toast ref={toast} />
      <div className="header">
        <h1>Manage orders</h1>
        <p>Manage all orders in one place</p>
      </div>
      <DataTable 
        value={orders} 
        paginator rows={5} 
        rowsPerPageOptions={[5, 10, 25, 50]} 
        loading={isFetching}
        emptyMessage={"No orders to display"}
      >
        <Column field="dateCreated" header="Date" style={{ whiteSpace: 'nowrap' }}></Column>
        <Column field="acceptedOffer.price" header="Order total"></Column>
        <Column field="acceptedOffer.priceSpecification.price" header="Base cost"></Column>
        <Column field="acceptedOffer.priceCurrency" header="Currency"></Column>
        <Column field="orderStatus" header="Status"></Column>
        <Column field="customer.identifier" header="Customer#"></Column>
        <Column field="seller.identifier" header="Seller#"></Column>
        <Column field="broker.identifier" header="Broker#"></Column>
      </DataTable>
      
    </div>
  )
}

export default Orders