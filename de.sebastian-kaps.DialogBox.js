/*!
@author Sebastian Kaps
@title de.sebastian-kaps.DialogBox
@version 0.1
*/

var frame = [];
var btns = [];
var panels = [];
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
    if (panels['message'] || panels['title'] || panels['bottom']) {
        close();
    };

    var tTemplate = gfx.widget("TITLE");
    var msgTemplate = gfx.widget("MESSAGE");
    var bTemplate = gfx.widget("BUTTON");

    // pixels of space to keep between buttons when clustering
    var spacing = 2;

    // check required window width and adjust if necessary
    var widthMin = (buttons.length)  * (bTemplate.width + spacing) + spacing
                    + (2 * gfx.widget("LEFT").width);
    if (w < widthMin) w = widthMin;

    // set up the frame
    /*
        index 0 to 7: tr, top, tl, left, right, bl, bottom, br

        0   1   2
        3       4
        5   6   7
    */
    for (var i = 0; i <= 7; i++) {
        frame[i] = GUI.addPanel();
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
    // title
    panels['title'] = GUI.addPanel();
    panels['title'].width = frame[1].width;
    panels['title'].height = 25;
    panels['title'].top = frame[3].top;
    panels['title'].left = frame[1].left;

    // copy some attributes from the GUI resources
    var tTemplateProperties = ['fontSize', 'color', 'font', 'valign',
                                'halign', 'bold','italic'];
    tTemplateProperties.forEach(function(key) {
        panels['title'][key] = tTemplate[key];
    });

    panels['title'].setImage(tTemplate.getImage());
    panels['title'].stretchImage = true;
    panels['title'].label = title;

    // message panel
    panels['message'] = GUI.addPanel();
    panels['message'].width = frame[1].width;
    panels['message'].height = frame[3].height - panels['title'].height
                        - bTemplate.getImage().height;
    panels['message'].left = frame[1].left;
    panels['message'].top = panels['title'].top + panels['title'].height;
    panels['message'].setImage(msgTemplate.getImage());
    panels['message'].stretchImage = true;

    // copy some attributes from the GUI resources
    var msgTemplateProperties = ['fontSize', 'color', 'font', 'valign',
                                    'halign', 'bold','italic'];
    msgTemplateProperties.forEach(function(key) {
        panels['message'][key] = msgTemplate[key];
    });

    // wrap text if message is too long for a single line...
    var labelWidth = panels['message'].getLabelSize(message)[0];
    if (labelWidth > panels['message'].width) {
        var lines = Math.ceil(labelWidth / panels['message'].width);
        var lineLength = Math.floor(message.length / lines);
        message = message.wordWrap(lineLength, '\n');
    }
    // ...and adjust panel height accordingly
    var labelHeight = panels['message'].getLabelSize(message)[1] + 5;
    var growBy;
    if (labelHeight > panels['message'].height) {
        growBy = labelHeight - panels['message'].height;
        panels['message'].height = labelHeight;
        // adjust other frame elements
        frame[3].height += growBy;
        frame[4].height += growBy;
        frame[5].top += growBy;
        frame[6].top += growBy;
        frame[7].top += growBy;
    }
    panels['message'].label = message;

    // button space
    panels['bottom'] = GUI.addPanel();
    panels['bottom'].width = frame[1].width;
    panels['bottom'].height = frame[3].height - panels['title'].height - panels['message'].height;
    panels['bottom'].left = frame[1].left;
    panels['bottom'].top = panels['message'].top + panels['message'].height;
    panels['bottom'].setImage(msgTemplate.getImage());
    panels['bottom'].stretchImage = true;

// now add the buttons
    for (var b = 0; b < buttons.length; b++) {
        btns[b] = GUI.addButton();
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
            btns[b].left = panels['message'].left
                            + Math.floor(panels['message'].width / 2)
                            - Math.ceil(btns[b].width / 2);
            break;
        case 2:
            btns[b].left = panels['message'].left
                            + ((2 * b + 1) * Math.floor(panels['message'].width / 4))
                            - Math.ceil(btns[b].width / 2);
            break;
        case 3:
            btns[b].left = panels['message'].left
                            + ((2 * b + 1) * Math.floor(panels['message'].width / 6))
                            - Math.ceil(btns[b].width / 2);
            break;
        case 4:
            btns[b].left = panels['message'].left
                            + ((2 * b + 1) * Math.floor(panels['message'].width / 8))
                            - Math.ceil(btns[b].width / 2);
            break;
        default:
            // default: constant spacing and buttons centered as a group
            bwidth_total = (buttons.length - 1) * (btns[b].width + spacing)
                            + btns[b].width;

            left_margin = Math.floor((panels['message'].width - bwidth_total)/2);

            btns[b].left = panels['message'].left + left_margin
                            + (b*(btns[b].width + spacing));
        }

        btns[b].top = (panels['bottom'].top + panels['bottom'].height) - (btns[b].height);
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
    panels['message'].visible = true;
    panels['title'].visible = true;
    panels['bottom'].visible = true;

    // clean up when switching pages within the activity
    CF.page()['__dbox'] = this;
    CF.page().onExit = function() {
        CF.page()['__dbox'].close();
        delete this['__dbox'];
        this.onExit = null;
    };
};

// remove all the widgets
function close() {
    btns.forEach(function(w){w.remove()});
    frame.forEach(function(w){w.remove()});
    for (var i in panels) {
        panels[i].remove();
    };
}

//********************************************************************************
// JavaScript String Extensions
//********************************************************************************
// String extensions for wordwrap
// String.wordWrap(maxLength: Integer, [breakWith: String = "\n"], [cutWords: Boolean = false]): String
// Returns a string with the extra characters/words "broken".
// maxLength: maximum amount of characters per line
// breakWith: string that will be added whenever it's needed to break the line
// cutWords:  if true, the words will be cut, so the line will have exactly "maxLength" characters, otherwise the words won't be cut
if (!String.prototype.wordWrap) {
    String.prototype.wordWrap = function wordWrap(m, b, c) {
        var i, j, s, r = this.split("\n");
        if (m > 0) {
            for (i in r) {
                for (s = r[i], r[i] = ""; s.length > m; j = c ? m : (j = s.substr(0, m).match(/\S*$/)).input.length - j[0].length || m, r[i] += s.substr(0, j) + ((s = s.substr(j)).length ? b : "")) { };
                r[i] += s;
            }
        }
        return r.join("\n");
    };
}


