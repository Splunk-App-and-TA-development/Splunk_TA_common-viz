# **Splunk Visualization - Scatterplot Matrix**

The scatterplot matrix visualization allows comparison between numeric sets of data, giving a rough idea if there is a linear correlation between multiple fields.
The scatterplot matrix consists of Rows and Columns of individual Scatterplots that plot an X and a Y value.
These values come from the fields sent from the search bar.


## **How To Use and Read the Scatterplot Matrix**

The scatterplot matrix could be considered a table of sorts. Each row compares data against the column.<br>
So for each label (or field) that is displayed, follow the label to the scatterplot, and that is what is being compared.<br>
For example, the top right box of the example on this dashboard compares avg_kbps (Y axis) to stdevp_kbps (X axis).<br>
The bottom left box compares avg_kbps (X axis) to stdevp_kbps (Y axis).<br>
The axis are switched, and give a different visualization of the data.

Additionally, the graph supports some interactivity. 

Click and drag over a portion of a scatterplot, and the same XY coordinates in the other plots will also be highlighted, and the legend will reflect the items within that highlight.<br>
Mouseover the legend items, and the corresponding data points will be highlighted in the scatter plots.<br>

You can find more information for Scatterplot Matricies at the links below.

[[Learning Omics | https://learningomics.wordpress.com/2013/01/31/scatterplot-matrices/ ]]
[[Engineering Statistics Handbook | http://www.itl.nist.gov/div898/handbook/eda/section3/eda33qb.htm]]

## **Configuration Options**
Scatterplot Matrix has many different configuration options, each split into similar sections. The options are displayed like this:

1. Configuration Option Name
    1. Valid Setting Options
    2. Description
    
## **Graph**

1. Box Padding
    1. &lt;integer&gt;
    2. This controls the space around each scatterplot.
	
2. Box Size
    1. &lt;integer&gt;
    2. This controls the size of each scatterplot.          
	
3. Number of Ticks
    1. &lt;integer&gt;
    2. This controls the number of tick marks on each axis.      
	
4. Axis Label Offset
    1. &lt;integer&gt;
    2. This controls how far away from the scatterplot matrix the labels for the axis appear.     
	
5. Height
    1. &lt;integer&gt;
    2. This is the height of the SVG. If you have clipping due to size, increase this.
	
6. Width
    1. &lt;integer&gt;
    2. This is the width of the SVG. If you have clipping due to size, increase this.

## **Legend**

1. **Show Legend**
    1. Yes, No
    2. This toggles the Legend.
                                
                            
2. **Height (px)**
    1. &lt;integer&gt;
    2. This is the height of the Legend Text.
                                
                            
3. **Position**
    1. Left, Right
    2. This controls where the legend is placed, either to the left or right of the
                                        matrix.
                                    
4. **Top Offset**
    1. &lt;integer&gt;
    2. This controls how far from the top of the Visualization the legend will
                                        display.
                                    
4. **Left Offset**
    1. &lt;integer&gt;
    2. THis controls how far from the left of the Visualization the legend wilL
                                        display.
                                        
## **Trendline**

1. **Show Trendlines**
    1. Yes, No
    2. This toggles the trendlines for each scatterplot.
                                
                            
2. **Show R-Value**
    1. No, R, R²
    2. Controls if, and how, the R value is displayed on the graph.
                                
                            
3. **Show One-to-One Data**
    1. Yes, No
    2. This controls the scatterplots on the Top-left to Bottom-Right Diagonal. This
                                        will remove the data points for those plots if No.
                          
4. **Trendline Width**
    1. &lt;integer&gt;
    1. This sets the width of the Trendline.
                                
                            
5. **Trendline Color**
    1. &lt;hex color&gt;
    2. This sets the color of the Trendline.
                                
## **Debug**

1. **Javascript Logging**
    1. Yes, No
    2. Disables or enables the logging of debug information for the visualization.

## **Data Points**

1. **Dot Size**
    1. &lt;integer&gt;
    2. This controls the size of the data points in the scatterplots.

## **Example Search**

1. `index=_internal component=Metrics group=per_sourcetype_thruput | bin _time span=1h | stats avg(kbps) as avg_kbps avg(eps) as avg_eps avg(ev) as avg_ev by series _time | fields - _time_`
2. `index=_internal component=Metrics group=per_sourcetype_thruput | stats avg(kbps) as avg_kbps avg(kb) as kb avg(eps) as avg_eps avg(ev) as avg_ev by series`
3. `|makeresults | eval data = "0,8;0,7;1,7;1,5;3,4;4,2,4,5;3,6;1,8;2,9", recs = split(data,";") | mvexpand recs | eval t = split(recs, ","), X = mvindex(t,0), Y = mvindex(t,1), series = "person" | fields series X Y | fields - _*`

## **Support**

Please ask a question on Answers. Tag it with "aplura_viz" to get noticed.
Support URL: answers.splunk.com

Report Acceleration: None
Data Model Acceleration: None
Summary Indexing: None

### Event Generator
Event Generation: None

### Third-party software

Please see individual licenses in the next section.

1. jQuery
1. underscore
1. d3

### Third-party Licenses

#### d3
Copyright (c) 2010-2016, Michael Bostock
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Michael Bostock may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#### jQuery

Copyright JS Foundation and other contributors, https://js.foundation/

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/jquery/jquery

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

====

All files located in the node_modules and external directories are
externally maintained libraries used by this software which have their
own licenses; we recommend you read them, as their terms may differ from
the terms above.


####  underscore

Copyright (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative
Reporters & Editors

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
