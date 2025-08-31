"use strict";
'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MapLeafletClient;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
require("ol/ol.css");
const Map_1 = __importDefault(require("ol/Map"));
const View_1 = __importDefault(require("ol/View"));
const Tile_1 = __importDefault(require("ol/layer/Tile"));
const OSM_1 = __importDefault(require("ol/source/OSM"));
const proj_1 = require("ol/proj");
const Feature_1 = __importDefault(require("ol/Feature"));
const Point_1 = __importDefault(require("ol/geom/Point"));
const Vector_1 = __importDefault(require("ol/source/Vector"));
const Vector_2 = __importDefault(require("ol/layer/Vector"));
const Style_1 = __importDefault(require("ol/style/Style"));
const Icon_1 = __importDefault(require("ol/style/Icon"));
const Overlay_1 = __importDefault(require("ol/Overlay"));
const react_2 = __importDefault(require("react"));
// Add pulsating dot CSS
const pulsatingDotStyle = `
.ol-marker-pulse {
  animation: ol-pulse 1.2s infinite;
  transform: translate(-50%, -100%);
}
@keyframes ol-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.7); }
  70% { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
`;
function MapLeafletClient() {
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const mapRef = (0, react_1.useRef)(null);
    const mapObj = (0, react_1.useRef)(null);
    const overlayRef = (0, react_1.useRef)(null);
    const [popupContent, setPopupContent] = (0, react_1.useState)('');
    const [popupOpen, setPopupOpen] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        function fetchTransactions() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                try {
                    const res = yield fetch('/api/transactions');
                    const data = yield res.json();
                    setTransactions((data.transactions || []).filter((tx) => tx.lat && tx.lng));
                }
                catch (_a) {
                    setTransactions([]);
                }
                finally {
                    setLoading(false);
                }
            });
        }
        fetchTransactions();
    }, []);
    (0, react_1.useEffect)(() => {
        if (!mapRef.current)
            return;
        // Clean up previous map instance
        if (mapObj.current) {
            mapObj.current.setTarget(undefined);
            mapObj.current = null;
        }
        // Create vector features for transactions
        const features = transactions.map((tx) => {
            const feature = new Feature_1.default({
                geometry: new Point_1.default((0, proj_1.fromLonLat)([tx.lng, tx.lat])),
                tx,
            });
            // SVG with built-in pulsating animation
            const svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="7" fill="#22c55e"/>
          <circle cx="16" cy="16" r="11" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.3">
            <animate attributeName="r" values="11;16;11" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      `;
            feature.setStyle(new Style_1.default({
                image: new Icon_1.default({
                    src: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
                    anchor: [0.5, 0.5],
                    scale: 1,
                }),
            }));
            return feature;
        });
        const vectorSource = new Vector_1.default({ features });
        const vectorLayer = new Vector_2.default({ source: vectorSource });
        // Create map
        const map = new Map_1.default({
            target: mapRef.current,
            layers: [
                new Tile_1.default({ source: new OSM_1.default() }),
                vectorLayer,
            ],
            view: new View_1.default({
                center: (0, proj_1.fromLonLat)([0, 20]),
                zoom: 2,
            }),
            controls: [],
        });
        mapObj.current = map;
        // Popup overlay
        let overlay = null;
        if (overlayRef.current) {
            overlay = new Overlay_1.default({
                element: overlayRef.current,
                autoPan: true,
            });
            map.addOverlay(overlay);
        }
        // Click handler for popups
        map.on('singleclick', function (evt) {
            setPopupOpen(false);
            if (!overlay)
                return;
            const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
            if (feature && feature.get('tx')) {
                const tx = feature.get('tx');
                setPopupContent(`
          <div><strong>${tx.location || 'Unknown'}</strong><br/>
          ₹${tx.amount}<br/>
          Status: ${tx.status}<br/>
          Device: ${tx.device}</div>
        `);
                overlay.setPosition(evt.coordinate);
                setPopupOpen(true);
            }
            else {
                overlay.setPosition(undefined);
                setPopupOpen(false);
            }
        });
        // Clean up on unmount
        return () => {
            map.setTarget(undefined);
            mapObj.current = null;
        };
    }, [transactions]);
    const handleZoomIn = () => {
        if (mapObj.current) {
            const view = mapObj.current.getView();
            view.setZoom(view.getZoom() + 1);
        }
    };
    const handleZoomOut = () => {
        if (mapObj.current) {
            const view = mapObj.current.getView();
            view.setZoom(view.getZoom() - 1);
        }
    };
    return (<card_1.Card className="h-full">
      <card_1.CardHeader className="pb-3 md:pb-4">
        <card_1.CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <lucide_react_1.MapPin className="h-4 w-4 md:h-5 md:w-5 text-purple-600"/>
          </div>
          <span className="text-base md:text-lg font-semibold">Transaction Map</span>
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
          <div className="h-[300px] w-full rounded-lg overflow-hidden relative">
            {/* Zoom controls */}
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleZoomIn} style={{
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 4,
            width: 32,
            height: 32,
            fontSize: 20,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 4,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }} aria-label="Zoom in">
                +
              </button>
              <button onClick={handleZoomOut} style={{
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 4,
            width: 32,
            height: 32,
            fontSize: 20,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }} aria-label="Zoom out">
                -
              </button>
            </div>
          {loading ? (<div className="flex items-center justify-center h-full text-gray-400">Loading...</div>) : (<>
                <div ref={mapRef} style={{ width: '100%', height: 300 }}/>
                <div ref={overlayRef} style={{
                position: 'absolute',
                background: 'white',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: 12,
                minWidth: 120,
                pointerEvents: 'auto',
                zIndex: 10,
                display: popupOpen ? 'block' : 'none',
            }} dangerouslySetInnerHTML={{ __html: popupContent }}/>
              </>)}
          </div>
          {/* Recent Transactions List below the map */}
          {transactions.length > 0 && !loading && (<div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="font-semibold text-sm mb-2 text-gray-700">Recent Transaction Locations</div>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((tx, idx) => (<div key={tx.id || idx} className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs cursor-pointer hover:bg-purple-50 transition" onClick={() => {
                    var _a;
                    if (mapObj.current) {
                        const view = mapObj.current.getView();
                        const coord = (0, proj_1.fromLonLat)([tx.lng, tx.lat]);
                        view.animate({ center: coord, zoom: 8, duration: 600 });
                        // Open popup for this marker
                        if (overlayRef.current) {
                            setPopupContent(`
                            <div><strong>${tx.location || 'Unknown'}</strong><br/>
                            ₹${tx.amount}<br/>
                            Status: ${tx.status}<br/>
                            Device: ${tx.device}</div>
                          `);
                            overlayRef.current.style.display = 'block';
                            setPopupOpen(true);
                            // Find the overlay and set its position
                            if (mapObj.current.getOverlays().getLength() > 0) {
                                (_a = mapObj.current.getOverlays().item(0)) === null || _a === void 0 ? void 0 : _a.setPosition(coord);
                            }
                        }
                    }
                }}>
                    <span className="font-medium text-purple-700">₹{tx.amount}</span>
                    <span className="text-gray-600">{tx.location || 'Unknown City'}</span>
                    <span className="text-gray-500">Lat: {tx.lat}</span>
                    <span className="text-gray-500">Lng: {tx.lng}</span>
                      </div>))}
              </div>
            </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
