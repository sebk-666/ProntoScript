/*!
@title HALightsControl
@author Sebastian Kaps
@version 0.0
*/

/*
---------------------------------------------------------------------------
    Home Assistant communication functions
---------------------------------------------------------------------------
*/

// access parameters
ha_host = CF.widget("HA_HOST_IP", "PARAMETERS", "HA_MOD").label;
ha_port = CF.widget("HA_PORT", "PARAMETERS", "HA_MOD").label;
ha_token = CF.widget("HA_TOKEN", "PARAMETERS", "HA_MOD").label;

/* call a specific doman/service through HA API for a given entity, e.g. "light", "turn_on", "Deckenlampe" */
function haService (domain, service, entityId) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/" + domain + "/" + service, true);
    request.setRequestHeader("Authorization:", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type:", "application/json");
	request.send('{"entity_id": "' +  entityId + '"}');
}

function haSetState(entityId, state) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request.setRequestHeader("Authorization:", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type:", "application/json");
	request.send('{"state": "' +  state + '"}');
}

function haSetAttribute(entityId, attribute, value) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request.setRequestHeader("Authorization:", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type:", "application/json");
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
        request.setRequestHeader("Authorization:", "Bearer " + ha_token);
        request.setRequestHeader("Content-Type:", "application/json");
        request.send('{"entity_id": "' +  entityId + '",'
                        + '"brightness_pct":' + '"' + newbri + '"'
                        + '}');
        currentBrightness = newbri;
    }
}

var request = new Array();
function getState(entityId) {
    //System.setDebugMask(9);
    request[entityId] = new com.philips.HttpLibrary.HttpRequest();
    request[entityId].open("GET", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request[entityId].setRequestHeader("Authorization:", "Bearer " + ha_token);
    request[entityId].setRequestHeader("Content-Type:", "application/json");

    var state;
    request[entityId].onreadystatechange = function() {
        if (request[entityId].readyState == 4) {
            regex = /"state": "(\w+)"/;
            state = (request[entityId].responseText).match(regex)[1];
            if (state == "on") {
                CF.widget(entityId).setImage(CF.widget("IMG_ON", "RESOURCES").getImage());
                CF.widget(entityId).label = "on";
            } else {
                CF.widget(entityId).setImage(CF.widget("IMG_OFF", "RESOURCES").getImage());
                CF.widget(entityId).label = "off";
            }
        }
    }
    request[entityId].send();
};

function haSetScene(roomName, scnName) {
    request = new com.philips.HttpLibrary.HttpRequest();
    request.open("POST", "http://" + ha_host + ":" + ha_port + "/api/services/hue/hue_activate_scene", true);
    request.setRequestHeader("Authorization:", "Bearer " + ha_token);
    request.setRequestHeader("Content-Type:", "application/json");
	request.send('{"group_name": "' +  roomName + '", "scene_name": "' + scnName  + '"}');
};

// return the brightness value for a single lamp
function haGetBrightness(entityId) {
    request[entityId] = new com.philips.HttpLibrary.HttpRequest();
    request[entityId].open("GET", "http://" + ha_host + ":" + ha_port + "/api/states/" + entityId, true);
    request[entityId].setRequestHeader("Authorization:", "Bearer " + ha_token);
    request[entityId].setRequestHeader("Content-Type:", "application/json");

    var state;
    request[entityId].onreadystatechange = function() {
        if (request[entityId].readyState == 4) {
            // only turned on lamps have 'brightness' attribute, so let's check
            // the lamp's state before trying to read the bri value
            regex = /"state": "(\w+)"/;
            state = (request[entityId].responseText).match(regex)[1];
            if (state == "on") {
                regex = /"brightness": (\d+)/;
                bri = (request[entityId].responseText).match(regex)[1];
                System.setGlobal('activelight_bri', Math.ceil(bri / 254 * 100));
            }
        }
    }
    request[entityId].send();
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
function lightButtonHelper(light) {
    if (light.label == "off") {
        light.setImage(CF.widget("IMG_ON", "RESOURCES").getImage());
        light.label = "on";

        if (activelight) {
            CF.widget(activelight + "_label").setColor(0xFFFFFF, 0);
        }
        activelight = light.tag;
        CF.widget(activelight + "_label").setColor(0x0000FF, 0);
    } else {
        light.setImage(CF.widget("IMG_OFF", "RESOURCES").getImage());
        light.label = "off";
        if (activelight == light.tag) {
            activelight = null;
            CF.widget(light.tag + "_label").setColor(0xFFFFFF, 0);
        }
    }
    haService("light", "toggle", light.tag);
}

/*
    Set up the Rotary Controller for brightness adjustment
*/
function setupRotary() {
    CF.activity().onRotary = function(clicks) {
        if (activelight && CF.widget(activelight).label == "on") {
            haLightChangeBrightness(activelight, 5 * clicks);
        }
    }
}

/*
    Update light states for an array of lights
*/
function update(lights) {
    for (i in lights) {
        getState('light.' + lights[i]);
    }
    CF.activity().scheduleAfter(10000, update);
}
