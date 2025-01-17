// For Nuxt 2
import Vue from 'vue'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSun, fas } from '@fortawesome/free-solid-svg-icons'
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { faWater } from '@fortawesome/free-solid-svg-icons';
import { faTint } from '@fortawesome/free-solid-svg-icons';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faFaucet } from '@fortawesome/free-solid-svg-icons';
import { faFaucetDrip } from '@fortawesome/free-solid-svg-icons';
// import { faTemperatureFull } from '@fortawesome/free-solid-svg-icons';
import { faThermometer } from '@fortawesome/free-solid-svg-icons';
import { faTintSlash } from '@fortawesome/free-solid-svg-icons';
// import { faTemperatureLow } from '@fortawesome/free-solid-svg-icons';
// import { faTemperatureHigh } from '@fortawesome/free-solid-svg-icons';

import { faFlaskVial } from '@fortawesome/free-solid-svg-icons';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faDisease } from '@fortawesome/free-solid-svg-icons';
import { faSkullCrossbones } from '@fortawesome/free-solid-svg-icons';
import { faVialVirus } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { faMaskVentilator } from '@fortawesome/free-solid-svg-icons';
import { faHandHoldingDroplet } from '@fortawesome/free-solid-svg-icons';



library.add(faDatabase);
library.add(faSun);
library.add(faWater);
library.add(faTint);
library.add(faDroplet); // fa-droplet-slash or fa-droplet
library.add(faCloud);
library.add(faFaucet);
library.add(faFaucetDrip); // fa-faucet-drip 
// library.add(faTemperatureFull);
library.add(faThermometer); // fa-thermometer-half or fa-thermometer-full
library.add(faTintSlash);
// library.add(faTemperatureLow);
// library.add(faTemperatureHigh);
library.add(faFlaskVial); // fa-flask-vial or fa-flask
library.add(faArrowUp);
library.add(faDisease);
library.add(faSkullCrossbones); // fa-skull-crossbones
library.add(faVialVirus); // fa-vial-virus
library.add(faBolt); // fa-bolt
library.add(faMaskVentilator); // fa-mask-ventilator
library.add(faHandHoldingDroplet); // fa-hand-holding-droplet







// This is important, we are going to let Nuxt.js worry about the CSS
config.autoAddCss = false

// You can add your icons directly in this plugin. See other examples for how you
// can add other styles or just individual icons.
library.add(fas)

// Register the component globally
Vue.component('font-awesome-icon', FontAwesomeIcon)


// Modify nuxt.config.js adding to the `css` and `plugins` sections.
css: [
  '@fortawesome/fontawesome-svg-core/styles.css'
]

plugins: [
  '~/plugins/fontawesome.js'
]
