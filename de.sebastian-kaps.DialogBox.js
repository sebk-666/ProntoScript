/*!
@author Sebastian Kaps
@title de.sebastian-kaps.DialogBox
@version 0.0
*/
 /**
  * USAGE:
  * - in PEP2/PEP3 create a hidden page for the UI elements, e.g. a RESOURCES page
  *   in the current activity; the location is configured via the "var gfx = ..." line below)
  * - add 4 images (e.g. 10x10 pixels in size) for the dialog box frame corners
  *   - tag them TL, TR, BL, BR
  *     (T is for "top", B for "bottom", L/R for left and right)
  * - add 4 images for the frame edges, tag them TOP, LEFT, RIGHT, BOTTOM
  * - add one image for the dialog box title background; tag it TITLE
  * - add one image for the dialog box message background; tag it MESSAGE
  * - add a button like the ones you want on the dialog box, tag it BUTTON
  *
  * Font attributes and alignment are copied from these templates.
  *
  * The dialog box buttons are specified as an array of tupels with the first
  * element in each tupel being the button label and the second element being
  * the code that's to be executed when the button is pressed. E.g.:
  *
  *   var myButtons = [
  *                   ["Show Alert", "GUI.alert('Hello World!');"],
  *                   ["Cancel", "close();"]
  *                 ];
  *
  * To open the dialog box call it like this:
  *
  *   dbox(width, height, title, message, buttons[]);
  *
  * e.g. (using the buttons array from above):
  *
  *   dbox(400, 200, "Example Dialog", "Some Message", myButtons);
  *
  * To close the dialog box, use close()
  */

  /**
 * TODO:
 * - check width and height constraints to make sure text and buttons
 *   fit into specified dimensions
 * - maybe autoscale font size / wrap text automatically
 * - remove(): is it possible to get all the dynamically created widgets
 *   without having to track them explicitely or removing other UI elements
 */


var frame = [];
var btns = [];
var tPanel,msgPanel,bPanel;

/*
args:
    w - width
    h - height
    title - dialog title
    message - text to display
    buttons[] - array of (button_text, action) tupels
*/
function dbox(w, h, title, message, buttons) {
    var gfx = CF.page("RESOURCES");

    // quick & dirty: destroy existing dialog when attempting to open a second one
    if (msgPanel || tPanel || bPanel) {
        close();
    };

    // set up the frame
    /*
        index 0 to 7: tr, top, tl, left, right, bl, bottom, br

        0   1   2
        3       4
        5   6   7
    */
    for (var i = 0; i <= 7; i++) {
        frame[i] = GUI.addPanel();
        frame[i].visible = false;
        frame[i].stretchImage = true;
    }

    // match the frame elements of the corners to their respective tags
    var corners = { 0:'TL', 2:'TR', 5:'BL', 7:'BR' };

    // size the corners
    [0,2,5,7].forEach(function(i) {
        frame[i].width  = gfx.widget(corners[i]).getImage().width;
        frame[i].height = gfx.widget(corners[i]).getImage().height;
    });

    // set up the edges
    // top
    frame[1].width = w - (2 * frame[0].width);
    frame[1].height = frame[0].height;
    frame[1].setImage(gfx.widget("TOP").getImage());
    frame[1].stretchImage = true;

    // bottom
    frame[6].width = w - (2 * frame[5].width);
    frame[6].height = frame[5].height;
    frame[6].setImage(gfx.widget("BOTTOM").getImage());
    frame[6].stretchImage = true;

    // left
    frame[3].width = frame[0].width;
    frame[3].height = h - (2 * frame[0].height);
    frame[3].setImage(gfx.widget("LEFT").getImage());
    frame[3].stretchImage = true;

    // right
    frame[4].width = frame[0].width;
    frame[4].height = h - (2 * frame[0].height);
    frame[4].setImage(gfx.widget("RIGHT").getImage());
    frame[4].stretchImage = true;

    // positions
    frame[0].top = Math.floor((GUI.height - h) /2);
    frame[0].left = Math.floor((GUI.width - w) /2);
    frame[0].setImage(gfx.widget("TL").getImage());

    frame[1].top = frame[0].top;
    frame[1].left = frame[0].left + frame[0].width;

    frame[2].top = frame[0].top;
    frame[2].left = frame[1].left + frame[1].width;
    frame[2].setImage(gfx.widget("TR").getImage());

    frame[3].top = frame[0].top + frame[0].height;
    frame[3].left = frame[0].left;

    frame[4].top = frame[0].top + frame[0].height;
    frame[4].left = frame[2].left;

    frame[5].top = frame[3].top + frame[3].height;
    frame[5].left = frame[3].left;
    frame[5].setImage(gfx.widget("BL").getImage());

    frame[6].top = frame[3].top + frame[3].height;
    frame[6].left = frame[1].left;

    frame[7].top = frame[3].top + frame[3].height;
    frame[7].left = frame[2].left;
    frame[7].setImage(gfx.widget("BR").getImage());

    /* window contents */
    var tTemplate = gfx.widget("TITLE");
    var msgTemplate = gfx.widget("MESSAGE");
    var bTemplate = gfx.widget("BUTTON");


    // title
    tPanel = GUI.addPanel();
    tPanel.visible = false;
    tPanel.width = frame[1].width;
    tPanel.height = 25;
    tPanel.top = frame[3].top;
    tPanel.left = frame[1].left;

    // copy some attributes from the GUI resources
    var tTemplateProperties = ['fontSize', 'color', 'font', 'valign',
                                'halign', 'bold','italic'];
    tTemplateProperties.forEach(function(key) {
        tPanel[key] = tTemplate[key];
    });

    tPanel.setImage(tTemplate.getImage());
    tPanel.stretchImage = true;
    tPanel.label = title;


    // message
    msgPanel = GUI.addPanel();
    msgPanel.visible = false;
    msgPanel.width = frame[1].width;
    msgPanel.height = frame[3].height - tPanel.height
                        - bTemplate.getImage().height;
    msgPanel.left = frame[1].left;
    msgPanel.top = tPanel.top + tPanel.height;
    msgPanel.setImage(msgTemplate.getImage());
    msgPanel.stretchImage = true;
    msgPanel.label = message;

    // copy some attributes from the GUI resources
    var msgTemplateProperties = ['fontSize', 'color', 'font', 'valign',
                                    'halign', 'bold','italic'];
    msgTemplateProperties.forEach(function(key) {
        msgPanel[key] = msgTemplate[key];
    });

    // button space
    bPanel = GUI.addPanel();
    bPanel.visible = false;
    bPanel.width = frame[1].width;
    bPanel.height = frame[3].height - tPanel.height - msgPanel.height;
    bPanel.left = frame[1].left;
    bPanel.top = msgPanel.top + msgPanel.height;
    bPanel.setImage(msgTemplate.getImage());
    bPanel.stretchImage = true;

// now add the buttons
    for (var b = 0; b < buttons.length; b++) {
        btns[b] = GUI.addButton();
        btns[b].visible = false;
        // copy some properties from the GUI resources again
        var bTemplateProperties = ['fontSize', 'font', 'valign', 'halign',
                                    'bold','italic'];
        bTemplateProperties.forEach(function(key) {
            btns[b][key] = bTemplate[key];
        });
        btns[b].setColor(bTemplate.color);

        btns[b].setImage(bTemplate.getImage(0), 0);
        btns[b].setImage(bTemplate.getImage(1), 1);
        btns[b].width = bTemplate.getImage().width;
        btns[b].height = bTemplate.getImage().height;

        // button placement
        switch(buttons.length) {
        case 1:
            btns[b].left = msgPanel.left
                            + Math.floor(msgPanel.width / 2)
                            - Math.ceil(btns[b].width / 2);
            break;
        case 2:
            btns[b].left = msgPanel.left
                            + ((2 * b + 1) * Math.floor(msgPanel.width / 4))
                            - Math.ceil(btns[b].width / 2);
            break;
        case 3:
            btns[b].left = msgPanel.left
                            + ((2 * b + 1) * Math.floor(msgPanel.width / 6))
                            - Math.ceil(btns[b].width / 2);
            break;
        case 4:
            btns[b].left = msgPanel.left
                            + ((2 * b + 1) * Math.floor(msgPanel.width / 8))
                            - Math.ceil(btns[b].width / 2);
            break;
        default:
            // default: constant spacing and buttons centered as a group
            var spacing = 2;  // pixels of space to add between buttons
            bwidth_total = (buttons.length - 1) * (btns[b].width + spacing)
                            + btns[b].width;

            left_margin = Math.floor((msgPanel.width - bwidth_total)/2);

            btns[b].left = msgPanel.left + left_margin
                            + (b*(btns[b].width + spacing));
        }

        btns[b].top = (bPanel.top + bPanel.height) - (btns[b].height);
        btns[b].label = buttons[b][0];
        // it's just a JS object, so we can add our own properties to it
        btns[b].action = buttons[b][1];
        btns[b].onPress = function() {this.transparent=true;
                                        eval(this.action);
                                        this.transparent=false;};
        btns[b].visible = true;
    }

    // make everything visible
    frame.forEach(function(w){w.visible=true});
    msgPanel.visible = true;
    tPanel.visible = true;
    bPanel.visible = true;
};

// remove all the widgets
function close() {
    btns.forEach(function(w){w.remove()});
    frame.forEach(function(w){w.remove()});
    tPanel.remove();
    msgPanel.remove();
    bPanel.remove();
}