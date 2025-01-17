//If the user has a token, we send it to index
//Si el usuario tiene token lo enviamos a su dashboard, es decir, no necesita autenticacion. 
export default function({ store, redirect }) {
    store.dispatch('readToken');
    
    if (store.state.auth) {
        return redirect('/dashboard')
    }
} 