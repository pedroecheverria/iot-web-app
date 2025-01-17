<template>
  <div class="row"><h3></h3></div>
</template>

<script>

  export default{
    middleware: 'authenticated',
    mounted(){
      $nuxt.$router.push('/dashboard'); // lo que hace es que redirige al usuario a la pagina de dashboard (NO REDIRIGE) 
    }
  } 