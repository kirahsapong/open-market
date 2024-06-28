import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { Chips } from 'primereact/chips';
import { Toast } from "primereact/toast";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Divider } from 'primereact/divider';
import { useGuard } from "../hooks/useGuard";
import StoreProtocol from "../web5/store.json"; 
import { type Record } from "@web5/api";
import { UniversalResolver, DidDht } from "@web5/dids";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Partner } from "../web5/types";
import { web5 } from "../web5/web5.service";


const Partners = () => {
  const { storeId } = useGuard();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [partners, setPartners] = useState<Partial<Partner & Record>[]>([]);
  const [dids, setDids] = useState<string[]>([]);
  const toast = useRef<Toast>(null);



  useEffect(() => {
    setIsFetching(true)
    const checkPartners = async () => {
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            protocol: StoreProtocol.protocol,
            protocolPath: "store/partner",
            schema: StoreProtocol.types.partner.schema
          }
        },
      })
      if (records && records.length) {
        const resolvedData: Partial<Partner & Record> [] = []
        for (const record of records) {
          const data = await record.data.json();
          resolvedData.push({ ...data, ...record });
        }
        setPartners(resolvedData)
      }
    }

    checkPartners();
    setIsFetching(false);
  }, [])


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { someError, someSuccess } = await addSeller();
    setIsLoading(false);
    if (someError.length) {
      showError(someError[0])
    }
    if (someSuccess > 0) {
      showSuccess(`Added ${someSuccess} seller${someSuccess > 1 ? 's' : ''}`)
      hideDialog()
    }
  }

  const addSeller = async () => {
    let someError = [];
    let someSuccess = 0;
    const resolver = new UniversalResolver({ didResolvers: [ DidDht ]});
    
    for (const did of dids) {
      const resolved = await resolver.resolve(did);
      if (resolved.didResolutionMetadata.error) {
        someError.push(resolved.didResolutionMetadata.errorMessage);
        continue;
      }
      const { record } = await web5.dwn.records.create({
        data: {
          identifier: did
        },
        message: {
          protocol: StoreProtocol.protocol,
          protocolPath: "store/partner",
          parentContextId: storeId,
          schema: StoreProtocol.types.partner.schema
        },
      })
      if (record) {
        await record.send(did)
        someSuccess++
      } else {
        someError.push("Error adding seller")
      }
    }
    if (someError.length > 1) {
      someError = ["Error with some addresses"]
    }
    return { someError, someSuccess };
  }

  const showError = (detail: string) => {
    toast.current?.show({severity:'error', summary: 'Error', detail, life: 3000});
  }

  const showSuccess = (detail: string) => {
    toast.current?.show({severity:'success', summary: 'Success', detail, life: 3000});
  }

  const showDialog = () => {
    setIsVisible(true);
  }

  const hideDialog = () => {
    setDids([]);
    setIsVisible(false);
  }

  return (
    <div id="partners">
      <Toast ref={toast} />
      <header>
        <h1>Manage partners</h1>
        <p>Manage sellers on your marketplace by seller address (or Decentralized ID)</p>
        <Button label="Add partner" onClick={showDialog}/>
      </header>
      <DataTable 
        value={partners} 
        paginator rows={5} 
        rowsPerPageOptions={[5, 10, 25, 50]} 
        tableStyle={{ minWidth: '50rem' }}
        loading={isFetching}
      >
        <Column field="_descriptor.dateCreated" header="Added"></Column>
        <Column field="identifier" header="Company"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="contactPoint.email" header="Email"></Column>
        <Column field="contactPoint.telephone" header="Telephone"></Column>

      </DataTable>
      <Dialog header={"Add partners"} visible={isVisible} style={{ width: '640px' }} onHide={hideDialog}>
        <p>Add sellers to your marketplace by seller address (or Decentralized ID).</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifer-1">Seller addresses</label>
            <Chips 
              inputId="identifier-1"
              value={dids}
              onChange={(e) => {if (dids?.length >= 6) return; setDids(e.value || [])}}
              placeholder={dids?.length ? "" : "did:xxx:xxx-xxx, did:xxx:xxx-xxx"}
              aria-describedby="identifier-help"
              autoComplete="off"
              separator=","
              allowDuplicate={false}
              addOnBlur={true}
            />
            <small id="identifier-help" className={(dids?.length >= 6) ? 'error' : ''}>
              {(dids?.length >= 6) ? "You can only add 6 at a time" : "You can get this address from the seller" }
            </small>
          </div>
          <div className="buttons">
            <Button label="Add &rarr;" loading={isLoading} />
          </div>
        </form>
        <Divider />
        <h2>Invite partners</h2>
        <div className="buttons">
          <Button label="Copy invite link" icon="pi pi-link" />
          <Button label="Copy my address" icon="pi pi-send" />
        </div>
      </Dialog>
    </div>
  )
}

export default Partners