# ProntoScript

A collection of ProntoScript libraries I'm working on.<br>

It has only been tested on the TSU9800 but should run on the TSU9600 as well.

I'm not an expert in JavaScript or ProntoScript programming and this stuff is mainly intended for my personal use, so don't expect it to be bug-free, beautiful or feature-complete ;)


## Documentation

### DialogBox
The purpose of this library is to display a dialog box with a configurable number of buttons to the user.
I originally wrote this to be able to choose an output device (TV or Projector) when launching an activity (e.g. "Watch DVD").

#### Preparations
* In PEP2/PEP3 create a hidden page for the UI elements. The default is a page tagged (i.e. it's ProntoScript name) `RESOURCES` in the current activity. The location can be configured in the "`var gfx = ...`" line near the top of the code.

* On this page, add 4 images (e.g. 10x10 pixels in size) repesenting the dialog box corners. Tag those `TL`, `TR`, `BL`, `BR` (i.e. "top left" through "bottom right") respectively.

* Add another 4 images for the frame edges, tag those `TOP`, `LEFT`, `RIGHT`, `BOTTOM`. These can also be 10x10 pixel snippets as they will be stretched to fit the dialog box dimensions.

* Add one Image for the dialog box title background, tag it `TITLE`, and another one for the message text background, tagged `MESSAGE`.
Both can use the same image resource, but they don't have to - depending on your GUI style.

* Add a button that serves as a template for the buttons that appear in the dialog box. Tag this one `BUTTON`.

The dialog window will use the font styles that are configured for the various elements, e.g. whatever you configure for font, font size, colour, alignment etc. on the `RESOURCES` page will be reflected in the dialog at run time.

#### How to use

A simple dialog is invoked by calling: 
`dbox(width, height, title, message, buttons[]);`

with:

* `width`(Integer): the dialog window's width in pixels 
* `height`(Integer): the dialog window's height in pixels 
* `title`(String): the dialog title (e.g. "Warning")
* `message`(String): the message text that is shown
* `buttons`(Array): definition of the buttons that are displayed (see below)

##### Buttons
The dialog box buttons are specified as an array of 2-tuples with the first element in each tuple being the button label and the second element specifying the code that is to be executed when the button is pressed:

`var myButtons = [`

`["Show Alert", "GUI.alert('Hello World!');"],`

`["Cancel", "close();"]`

`];`

This defines two buttons "Show Alert" and "Cancel", where the first displays a "Hello World" message using the `GUI.alert()` system function and the latter closes the dialog.


##### Closing the dialog
To get rid of the dialog window, simply call the `close()` function.

-
### HABatteryStatus

This library is used to regularly send the TSU's remaining battery charge to my Home-Assistant instance, so I can track it from there.

-
### HALightsControl

This library provides some helper function to control my Hue home lights from the TSU by utilizing the Home-Assistant REST API (instead of talking directly to the Hue bridge).
