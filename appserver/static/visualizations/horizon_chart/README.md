# Horizon Chart

Documentation:
http://docs.splunk.com/Documentation/HorizonChart/1.2.0/HorizonChartViz/HorizonChartIntro

## Sample Searches

```
| inputlookup stocks.csv | eval _time = strptime(date, "%Y-%m-%d")| timechart span=1d  latest(open) by ticker_symbol | filldown
```