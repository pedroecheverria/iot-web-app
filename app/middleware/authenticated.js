//If the user does not have a token, we send it to login
//si el usuario no tiene token lo enviamos a login
export default function({ store, redirect }) {
    
    store.dispatch("readToken"); // We read the token from the store
  
    if (!store.state.auth) {
      return redirect("/login");
    }
  }