import { Button } from "primereact/button"


const Orders = () => {
  return (
    <div id="orders">
      <h1>A marketplace economy for everyone</h1>
      <div>
        <Button label="Create a marketplace" />
      </div>
      <div>
        <Button link label="I just want to list some products" />
      </div>
    </div>
  )
}

export default Orders