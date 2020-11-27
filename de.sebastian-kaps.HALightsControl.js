/*!
@title HALightsControl
@author Sebastian Kaps
@version 0.1
*/

/*
---------------------------------------------------------------------------
    Home Assistant communication functions
---------------------------------------------------------------------------
*/

// access parameters
var ha_host = CF.widget("HA_HOST_IP", "PARAMETERS", "HA_MOD").label;
var ha_port = CF.widget("HA_PORT", "PARAMETERS", "HA_MOD").label;
var ha_token = CF.widget("HA_TOKEN", "PARAMETERS", "HA_MOD").label;

// preload images
const IMG_ON = CF.widget("IMG_ON", "RESOURCES").getImage();
const IMG_OFF = CF.widget("IMG_OFF", "RESOURCES").getImage();

var pageChanged = 0;

/* call a specific doman/service through HA API for a given entity, e.g. "light", "turn_on", "Deckenlampe" */
function haService (domain, service, entityId) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/" + domain + "/" + service, true);
    request.setRequestHeader("Authorization", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Connection", "Close");
    request.send('{"entity_id": "' +  entityId + '"}');
}

function haSetState(entityId, state) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request.setRequestHeader("Authorization", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Connection", "Close");
	request.send('{"state": "' +  state + '"}');
}

function haSetAttribute(entityId, attribute, value) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request.setRequestHeader("Authorization", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Connection", "Close");
    request.send('{"state": "home", "attributes": {"' + attribute + '": ' + '"' + value + '"}}');
}

var currentBrightness;
function haLightChangeBrightness(entityId, delta_pct) {
    if (currentBrightness === undefined) {
        currentBrightness = Number(System.getGlobal('activelight_bri')) || 50;
    }
    newbri = currentBrightness + Number(delta_pct);

    if (newbri  >= 0 && newbri <= 100) {
        request = new com.philips.HttpLibrary.HttpRequest();
        request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/light/turn_on", true);
        request.setRequestHeader("Authorization", "Bearer " + ha_token);
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Connection", "Close");
        request.send('{"entity_id": "' +  entityId + '",'
                        + '"brightness_pct":' + '"' + newbri + '"'
                        + '}');
        currentBrightness = newbri;
    }
}

function haLightBrightnessStep(entityId, delta_pct) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/light/turn_on", true);
    request.setRequestHeader("Authorization", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Connection", "Close");
    request.send('{"entity_id": "' +  entityId + '",'
                    + '"brightness_step_pct":' + '"' + delta_pct + '"'
                    + '}');
}

var stateRequest = {};
function getState(entityId) {
    //System.setDebugMask(9);
    //System.print("GetState: " + entityId);
    stateRequest[entityId] = new com.philips.HttpLibrary.HttpRequest();
    stateRequest[entityId].open("GET", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    stateRequest[entityId].setRequestHeader("Authorization", "Bearer " + ha_token);
    stateRequest[entityId].setRequestHeader("Content-Type", "application/json");
    stateRequest[entityId].setRequestHeader("Connection", "Close");

    var state;
    stateRequest[entityId].onreadystatechange = function() {
        if (stateRequest[entityId].readyState == 4 && stateRequest[entityId].status == 200) {
            //System.print("Response: " + entityId)
            regex = /"state": "(\w+)"/;
            state = (stateRequest[entityId].responseText).match(regex)[1];
            if (state == "on") {
                CF.widget(entityId).setImage(IMG_ON);
                CF.widget(entityId).label = "on";
            } else {
                CF.widget(entityId).setImage(IMG_OFF);
                CF.widget(entityId).label = "off";
            }
            delete stateRequest[entityId];
        }
    }
    stateRequest[entityId].send();
};

function haSetScene(roomName, scnName) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/hue/hue_activate_scene", true);
    request.setRequestHeader("Authorization", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Connection", "Close");
	request.send('{"group_name": "' +  roomName + '", "scene_name": "' + scnName  + '"}');
};

// return the brightness value for a single lamp
function haGetBrightness(entityId) {
    stateRequest[entityId] = new com.philips.HttpLibrary.HttpRequest();
    stateRequest[entityId].open("GET", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    stateRequest[entityId].setRequestHeader("Authorization", "Bearer " + ha_token);
    stateRequest[entityId].setRequestHeader("Content-Type", "application/json");

    var state;
    stateRequest[entityId].onreadystatechange = function() {
        if (stateRequest[entityId].readyState == 4 && stateRequest[entityId].status == 200) {
            // only turned on lamps have 'brightness' attribute, so let's check
            // the lamp's state before trying to read the bri value
            regex = /"state": "(\w+)"/;
            state = (stateRequest[entityId].responseText).match(regex)[1];
            if (state == "on") {
                regex = /"brightness": (\d+)/;
                bri = (stateRequest[entityId].responseText).match(regex)[1];
                System.setGlobal('activelight_bri', Math.ceil(bri / 254 * 100));
            }
            delete stateRequest[entityId];
        }
    }
    stateRequest[entityId].send();
};

/*
---------------------------------------------------------------------------
    UI Helper functions
---------------------------------------------------------------------------
*/

var activelight;

/*
    Tapping the label makes a light 'activelight' (dim using rotary controller)
    in case it is turned on. Lights that are turned off are ignored.
    The label color reflects the 'activelight' state.
    Tapping the label again, clears the 'activelight' state as does turning
    the light off.
*/
function lightLabelHelper(label) {
    thisLight = (label.tag).replace(/_label$/, '');

    if (CF.widget(thisLight).label == "on") {
        if (activelight) {
            CF.widget(activelight + "_label").setColor(0xFFFFFF, 0);
            if (activelight == thisLight) {
                activelight = null;
            } else {
                haGetBrightness(thisLight);
                activelight = thisLight;
                CF.widget(label.tag).setColor(0x0000FF, 0);
            }
        } else {
            haGetBrightness(thisLight);
            activelight = thisLight;
            CF.widget(label.tag).setColor(0x0000FF, 0);
        }
    }
}

/*
    Changes the button image according to the light's state.
    If light was the 'activelight', clears that association when turning off.
*/

var lightStateChanged = {};
function lightButtonHelper(light) {
    if (light.label == "off") {
        light.setImage(IMG_ON);
        light.label = "on";

        if (activelight) {
            CF.widget(activelight + "_label").setColor(0xFFFFFF, 0);
        }
        activelight = light.tag;
        CF.widget(activelight + "_label").setColor(0x0000FF, 0);
    } else {
        light.setImage(IMG_OFF);
        light.label = "off";
        if (activelight == light.tag) {
            activelight = null;
            CF.widget(light.tag + "_label").setColor(0xFFFFFF, 0);
        }
    }
    haService("light", "toggle", light.tag);
    lightStateChanged[light.tag] = true;
}

/*
    Set up the Rotary Controller for brightness adjustment
*/
function setupRotary() {
    CF.activity().onRotary = function(clicks) {
        if (activelight && CF.widget(activelight).label == "on") {
           // haLightChangeBrightness(activelight, 5 * clicks); // pre HA 0.107.x

           // this requires Home-Assistent Core >v0.107
           haLightBrightnessStep(activelight, 5 * clicks);
        }
    }
}

/*
    Update light states for an array of lights
*/
function update(lights) {
    for (i in lights) {
        if (lightStateChanged['light.' + lights[i]]) {
            lightStateChanged['light.' + lights[i]] = false;
            continue;
        }
        getState('light.' + lights[i]);
    }
    CF.activity().scheduleAfter(5000, updateLoop, lights);
}

// we need to separate the "loop" function as update() is called
// by the page script and is most likely executed before the scheduled one
function updateLoop(lights) {
    if (pageChanged) {
        CF.page().onExit = function(){pageChanged++; };
        pageChanged--;
        return;
    };
    update(lights);
}

// we need to have an exit condition for the scheduleAfter() function;
// beware of onEntry as that's run after the page script;
// this needs to be a counter to avoid setting multiple timers with accidental double-taps
(function(){
    CF.page().onExit = function(){
                        pageChanged++;
                        // invalidate all .onreadystatechange callbacks when exiting the page
                        for (req in stateRequest) {
                            delete stateRequest.req;
                        }
                    };
}());