"use client"

import { useState, useEffect, useRef } from 'react';
import { TrendingDown, TrendingUp, Bell, Search, BarChart3, Filter, Volume2, DollarSign } from 'lucide-react';

export default function TradingBot() {
  const [condition, setCondition] = useState('down5');
  const [days, setDays] = useState(7);
  const [marketCap, setMarketCap] = useState('all');
  const [maxStocks, setMaxStocks] = useState(20);
  const [minVolume, setMinVolume] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartInterval, setChartInterval] = useState('D');
  const chartContainerRef = useRef(null);

  const conditions = {
    down5: { label: 'More than 5% down', threshold: -5, direction: 'down' },
    down10: { label: 'More than 10% down', threshold: -10, direction: 'down' },
    down15: { label: 'More than 15% down', threshold: -15, direction: 'down' },
    up5: { label: 'More than 5% up', threshold: 5, direction: 'up' },
    up10: { label: 'More than 10% up', threshold: 10, direction: 'up' },
    up20: { label: 'More than 20% up', threshold: 20, direction: 'up' },
    up30: { label: 'More than 30% up', threshold: 30, direction: 'up' },
  };

  const marketCapRanges = {
    all: { label: 'All Market Caps', min: 0, max: Infinity },
    micro: { label: 'Under 300M (Micro Cap)', min: 0, max: 300000000 },
    small: { label: '300M - 2B (Small Cap)', min: 300000000, max: 2000000000 },
    mid: { label: '2B - 10B (Mid Cap)', min: 2000000000, max: 10000000000 },
    large: { label: '10B - 200B (Large Cap)', min: 10000000000, max: 200000000000 },
    mega: { label: 'Over 200B (Mega Cap)', min: 200000000000, max: Infinity },
  };

  const chartIntervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
  ];

  useEffect(() => {
    loadAllStocks();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [marketCap, minVolume, minPrice, maxPrice, allStocks]);

  useEffect(() => {
    if (selectedStock && chartContainerRef.current) {
      const exchange = selectedStock.exchange || 'NASDAQ';
      loadTradingViewChart(selectedStock.symbol, chartInterval, exchange);
    }
  }, [selectedStock, chartInterval]);

  const loadTradingViewChart = (symbol, interval, exchange) => {
    if (!chartContainerRef.current) return;
    
    chartContainerRef.current.innerHTML = '';
    
    const fullSymbol = exchange ? `${exchange}:${symbol}` : symbol;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      symbol: fullSymbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      backgroundColor: '#ffffff',
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com'
    });
    
    chartContainerRef.current.appendChild(script);
  };

  const loadAllStocks = async () => {
    setLoadingStocks(true);
    const fmpApiKey = process.env.NEXT_PUBLIC_FMP_API_KEY;
    
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=1000000&limit=5000&apikey=${fmpApiKey}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const stocks = data
          .filter(stock => 
            (stock.exchangeShortName === 'NASDAQ' || stock.exchangeShortName === 'NYSE') &&
            stock.marketCap > 0 && stock.price > 0
          )
          .map(stock => ({
            symbol: stock.symbol,
            name: stock.companyName,
            marketCap: stock.marketCap,
            price: stock.price,
            volume: stock.volume || 0,
            exchange: stock.exchangeShortName
          }));
        setAllStocks(stocks);
      }
    } catch (err) {
      setAllStocks([
        { symbol: 'AAPL', name: 'Apple Inc.', marketCap: 3000000000000, price: 175, volume: 50000000, exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft', marketCap: 2800000000000, price: 380, volume: 25000000, exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet', marketCap: 1800000000000, price: 140, volume: 20000000, exchange: 'NASDAQ' },
        { symbol: 'NVDA', name: 'NVIDIA', marketCap: 1200000000000, price: 480, volume: 40000000, exchange: 'NASDAQ' },
      ]);
    }
    setLoadingStocks(false);
  };

  const filterStocks = () => {
    const range = marketCapRanges[marketCap];
    const filtered = allStocks.filter(stock => 
      stock.marketCap >= range.min && stock.marketCap < range.max &&
      stock.volume >= minVolume && stock.price >= minPrice && stock.price <= maxPrice
    );
    setFilteredStocks(filtered);
  };

  const scanStocks = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    setSelectedStock(null);
    const fmpApiKey = process.env.NEXT_PUBLIC_FMP_API_KEY;
    const stocksToScan = filteredStocks.slice(0, maxStocks);
    const matchingStocks = [];

    if (stocksToScan.length === 0) {
      setError('No stocks match your filters.');
      setLoading(false);
      return;
    }

    try {
      for (let stock of stocksToScan) {
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/historical-price-full/${stock.symbol}?apikey=${fmpApiKey}`
        );
        const data = await response.json();
        
        if (data.historical && data.historical.length >= days + 1) {
          const current = parseFloat(data.historical[0].close);
          const past = parseFloat(data.historical[days].close);
          const change = ((current - past) / past) * 100;
          const cond = conditions[condition];
          
          if ((cond.direction === 'down' && change <= cond.threshold) || 
              (cond.direction === 'up' && change >= cond.threshold)) {
            matchingStocks.push({
              symbol: stock.symbol,
              name: stock.name,
              currentPrice: current.toFixed(2),
              pastPrice: past.toFixed(2),
              percentChange: change.toFixed(2),
              direction: change > 0 ? 'up' : 'down',
              marketCap: stock.marketCap,
              volume: data.historical[0].volume,
              exchange: stock.exchange
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setResults(matchingStocks);
      if (matchingStocks.length === 0) setError(`Scanned ${stocksToScan.length} stocks. No matches.`);
    } catch (err) {
      setError('Error fetching data.');
    }
    setLoading(false);
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  const formatMarketCap = (mc) => mc >= 1e9 ? `$${(mc/1e9).toFixed(1)}B` : `$${(mc/1e6).toFixed(1)}M`;
  const formatVolume = (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(1)}K`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trading Bot Pro</h1>
            </div>

            {loadingStocks ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-600">Loading stocks...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />Market Cap
                  </label>
                  <select value={marketCap} onChange={(e) => setMarketCap(e.target.value)} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900">
                    {Object.entries(marketCapRanges).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2"><DollarSign className="w-4 h-4 inline mr-1" />Min Price</label>
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 100000)} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2"><Volume2 className="w-4 h-4 inline mr-1" />Min Volume</label>
                  <input type="number" value={minVolume} onChange={(e) => setMinVolume(parseInt(e.target.value) || 0)} placeholder="e.g., 1000000" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">{filteredStocks.length} stocks match</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900">
                    {Object.entries(conditions).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Days</label>
                    <input type="number" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 7)} min="1" max="365" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Scan</label>
                    <input type="number" value={maxStocks} onChange={(e) => setMaxStocks(parseInt(e.target.value) || 20)} min="5" max="100" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white text-gray-900" />
                  </div>
                </div>

                <button onClick={scanStocks} disabled={loading} className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:text-gray-200 transition-colors flex items-center justify-center gap-2">
                  {loading ? <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />Scanning...</> : <><Search className="w-5 h-5" />Scan Stocks</>}
                </button>
              </div>
            )}

            {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {results.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Matching Stocks ({results.length})</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((stock) => (
                    <div key={stock.symbol} onClick={() => handleStockClick(stock)} className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedStock?.symbol === stock.symbol ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {stock.direction === 'up' ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                          <div>
                            <h3 className="font-bold text-gray-800">{stock.symbol}</h3>
                            <p className="text-xs text-gray-600">{stock.name}</p>
                            <p className="text-xs text-gray-500">${stock.currentPrice} • {formatMarketCap(stock.marketCap)} • Vol: {formatVolume(stock.volume)}</p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${stock.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>{stock.percentChange}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-800">{selectedStock ? selectedStock.symbol : 'Select a Stock'}</h2>
              </div>
              {selectedStock && (
                <a
                  href={`tradingview://chart?symbol=${selectedStock.exchange}:${selectedStock.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    setTimeout(() => {
                      window.open(`https://www.tradingview.com/chart/?symbol=${selectedStock.exchange}:${selectedStock.symbol}`, '_blank');
                    }, 500);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.55c0 4.35-3.15 8.57-7.56 9.56L12 18.09l-.44 7.8C7.15 24.9 4 20.68 4 16.33V7.78l8-3.6z"/>
                  </svg>
                  Open in App
                </a>
              )}
            </div>

            {selectedStock ? (
              <>
                <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-gray-600">Price</p><p className="text-lg font-bold text-gray-900">${selectedStock.currentPrice}</p></div>
                    <div><p className="text-xs text-gray-600">Change</p><p className={`text-lg font-bold ${selectedStock.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>{selectedStock.percentChange}%</p></div>
                    <div><p className="text-xs text-gray-600">Volume</p><p className="text-lg font-bold text-gray-900">{formatVolume(selectedStock.volume)}</p></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {chartIntervals.map((interval) => (
                    <button key={interval.value} onClick={() => setChartInterval(interval.value)} className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors ${chartInterval === interval.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
                      {interval.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-0">
                  <div ref={chartContainerRef} className="w-full h-full rounded-lg border border-gray-200 bg-white" style={{ minHeight: '450px' }}>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <BarChart3 className="w-24 h-24 mb-4" />
                <p className="text-lg">Click on a stock to view TradingView chart</p>
                <p className="text-sm mt-2">Professional-grade technical analysis</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800"><strong>🚀 TradingView Advanced Charts!</strong> Professional charting with 50+ indicators, drawing tools, and real-time analysis. Optimized for 300 API calls/min.</p>
        </div>
      </div>
    </div>
  );
}