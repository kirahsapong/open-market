import { InputText } from "primereact/inputtext"

const Settings = () => {
  
  return (
    <div id="settings">
    <h1>Settings</h1>
    <p>Manage all settings for your store or marketplace.</p>
    <form>
      <div className="field">
        <label>Entity name</label>
        <InputText 
          name="name"
          placeholder="Store or marketplace name"
        />
        <small>
          The name for your store or marketplace
        </small>
      </div>
    </form>
  </div>
  )
}

export default Settings