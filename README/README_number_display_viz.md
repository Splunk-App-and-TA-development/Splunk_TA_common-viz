# **Number Display viz**

A collection of ultra-configurable, single-statistic visualizations for Splunk. Includes the following styles: gauge, horseshoe, spinner, shapes (rectangle, hexagon, circle, ring, donut). Make dashboards come alive with animated number changes and subtle pulse animations.

![screenshot](https://raw.githubusercontent.com/ChrisYounger/number_display_viz/master/static/demo.png)

![number-display-viz](https://cdn.apps.splunk.com/media/public/docimages/f569b50e-8a4e-11e9-8815-0667a25d8762.png)

**Known issue:** Splunk can be laggy (causing formatting options to not apply) with visualizations that have many formatting options. Please be patient when the formatting form is opening and when switching formatting tabs. If the form opens twice and overlaps, then the settings won't save properly.


## **Release Notes** 
#### Version 1.6.8
July 26, 2020 / Minor bug fixes

#### v1.6.7
Fix another bug for when sparkline field is null

#### v1.6.6
* Fix bug where in specific situations the threshold value would be rendered instead of the value. Thank you to jmcr for finding this bug and providing a reproducible test case.


## **Usage**
This visualization can deal with most datasets you want to throw at it. However for the most reliable results, use a search where the field names are exactly "value", "title" and "sparkline".
```
|stats sparkline(avg(SOME_VALUE)) as sparkline latest(SOME_VALUE) as value
```

For multiple items do this:
```
| rename SPLIT_CATEGORY as title | stats sparkline(avg(SOME_VALUE)) as sparkline latest(SOME_VALUE) as value BY title
```

The configured viz formatting can be overridden in data by havign specifically named fields.<br>
Here is an example where the subtitle is supplied in the data:
```
| rename SPLIT_CATEGORY as title | stats sparkline(avg(SOME_VALUE)) as sparkline latest(SOME_VALUE) as value latest(SOME_VALUE2) as subtext BY title
```

another way of doing the same thing is like so:
```
| rename SPLIT_CATEGORY as title | stats sparkline(avg(SOME_VALUE)) as sparkline latest(SOME_VALUE) as value BY title | eval subtext = "something"
```

These are the fields that can be overridden in data:

| Field | Type | Description |
|---|---|---|
| value | Numeric | The value which will be used for threshold calculation and to set the gauge position or spinner speed. Viz will attempt to autoguess this field if not explicity supplied. |
| title | String | The title of the metric which will be shown as a text overlay. Viz will attempt to autoguess this field if not explicity supplied. |
| sparkline | sparkline array | The sparkline field to use as the area or line chart overlay. Viz will attempt to autoguess this field if not explicity supplied. |
| color | HTML color code | Set the base color, ignoring the thresholds. By using this field you can use any threshold logic you like in the search query |
| primarycolor | HTML color code | Similar to above but will only override the primary color. The threshold color can still be used by other components. The primary color is only used by the main element (the gauge, spinner or shape background) in the viz. |
| secondarycolor | HTML color code | As above. |
| text | String | If supplied, this field enables overriding what would be shown as the numeric value |
| subtitle | String | Override the subtitle value. Note that subtitle must be blank in the formatting options |
| min | Number | Overrides the "min" limit |
| max | Number | Overrides the "max" limit |



### **Formatting options** 
![formatting-options](https://cdn.apps.splunk.com/media/public/docimages/f7e74d8c-8a4e-11e9-92f7-0667a25d8762.png)

1. Set the height. Since most Styles have a fixed aspect ratio this also sets the width. When blank it will automatically determine the size so that all items can fit on a single line. Items will split onto multiple lines when using a hardcoded size if there is not enough space.
2. Set the minimum horizontal spacing between items.
3. The data limits are important for the gauge and spinner styles only.
4. Set thresholds and leave any blank that are not needed. If you need more thresholds or non-numeric thresholds then compute them in the search query and pass the color as the color field.
5. The primary and secondary fields are the colors that are used by the main style component such as the gauge, spinner, or the shape color. This allows the color to be set to a static color and the threshold color to be used for the textvalue overlay, the sparkline or other places. Exactly what the primary or secondary color affects is different for each style, however it is typically a gradient range. If the Primary and Secondary color are set exactly the same then some of the shape textures will not be visible.
6. To show a sparkline, then be sure to pass in sparkline data. use | stats sparkline(AGG_FUNCTION(VALUE))
7. The Text, Title, Subtitle tabs allow for configuring how text overlays are applied. They are all kind of the same except the text value can have animations on change, and a unit prefix/suffix.
 - If the data has a sparkline field but no value field then the last value of the sparkline will be used.
 - The Title and Subtitle options should be left blank to use values from the data instead.
 - Advanced font styles are hosted by Google Fonts so these won't work unless the viewer has an internet connection.


### **Icons**
The title, text, or subtitle fields allow for HTML injection. This allows icons to be used in place of text or numbers.
Any icon from the FontAwesome v5 Free icon sets can be used, the complete list is here: https://fontawesome.com/cheatsheet/
There are also some Splunk built-in icons that can be used. See the list at the following page of your Splunk environment: `/en-GB/static/docs/style/style-guide.html#icons`
Here is an example search query to display an icon:

![icons-settings](https://cdn.apps.splunk.com/media/public/docimages/1c7849de-8a64-11e9-8ed7-02a6ec245c20.png)



### **Custom fonts**
It is possible to use custom fonts (hosted on the internet) by overriding specific CSS classes in a HTML panel: `.number_display_viz-font1 .. font5.`

Example: https://git.io/fjz5B

![fonts-settings](https://cdn.apps.splunk.com/media/public/docimages/3a0c7092-8a64-11e9-b358-02a6ec245c20.png)




### **Third party software** 
The following third-party libraries are used by this app. Thank you!

- jQuery - MIT - https://jquery.com/
- Chart.js - MIT - https://www.chartjs.org/
- Font Awesome - Creative Commons Attribution-ShareAlike 4.0 License - https://fontawesome.com/
- Tinycolor - MIT - https://github.com/bgrins/TinyColor
- Fan SVGs are by mynamepong - Creative Commons BY 3.0 - https://www.flaticon.com/authors/mynamepong
- SVG textures are by svgbackgrounds.com - Creative Commons Attribution-ShareAlike 4.0 License - https://www.svgbackgrounds.com
- Four spinners from https://loading.io/





Copyright (C) 2020 Chris Younger | [Source code](https://github.com/ChrisYounger/number_display_viz) | [Splunkbase](https://splunkbase.splunk.com/app/4537/) | [Questions, Bugs or Suggestions](https://answers.splunk.com/app/questions/4537.html) | [My Splunk apps](https://splunkbase.splunk.com/apps/#/author/chrisyoungerjds)

Please see the documentation on the Splunkbase application page or use the in-product documentation.
