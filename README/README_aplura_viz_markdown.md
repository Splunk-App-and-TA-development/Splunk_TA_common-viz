# **Splunk Visualization - markdown**
        The Markdown Visualization allows you to specify a Markdown (md) or AsciiDoc (adoc) file to render in the browser as HTML.
        Once configured, you can place a `markdown_style.css` file in the `$APP_HOME/appserver/static` folder of the app the 
        visualization is configured to use. The starting class is `markdown`. A sample has been provided. 
        
## Configuration
The Markdown Visualization has a few options. The options are displayed like this:

1. Configuration Option Name
    1. Valid Setting Options
    1. Description
    
## Render
1. Dialect
    1. Maruku, Gruber, ASCIIDoctor
    1. Maruku and Gruber are "Markdown" dialects. Choose ASCIIDoctor if your source is in adoc format.
1. Location
    1. Local File - Put the markdown source in the `appserver/static` folder of an app.
    1. Panel HTML - Put the markdown source in a panel on the dashboard as the visualization.
    1. Inline Search - Put the markdown source directly in a search.
    
## Local File
1. App Name
    1. &lt;string&gt;
    1. This is the name of the app where the File resides.
    1. Also used to pin point the `markdown_style.css` file to apply CSS style to the Markdown.
1. Path
    1. &lt;string&gt;
    1. This is the extra path needed to find the file. There should be no leading or following slashes. This path is RELATIVE to `$APP_HOME/appserver/static`.
1. File Name
    1. &lt;string&gt;
    1. This is the name of markdown file. No extension needs to be put here, but the file needs to end with either `md` or `adoc` on the server.
    
## Panel HTML
1. HTML ID
    1. This is the HTML `id` attribute of the element containing the Markdown Source.
    1. The element should be the first root element of the `<row><panel><html>` source.
    1. Multiple Elements are supported. Separate with comma `,`. 

## Inline Search
1. Search Field
    1. Dictates which field in the result set contains the markdown source.
    1. Multiple rows will be concatenated.

## Debug

1. JavasScript Logging
    1. yes, no
    1. This controls if debug logging should be enabled for the view. 
    
## Example Search

1. `| makeresults`
1. `| makeresults | eval markdown = "## Heading 1"`

## Support

Please ask a question on Answers. Tag it with "aplura_viz" to get noticed.
Support URL: answers.splunk.com

## Third-party software

 The Markdown Visualization uses `asciidoctor.js` and `markdown.js`.

## Acceleration

Report Acceleration: None
Data Model Acceleration: None
Summary Indexing: None

## Event Generator

The Markdown Visualization does not have an event generator.