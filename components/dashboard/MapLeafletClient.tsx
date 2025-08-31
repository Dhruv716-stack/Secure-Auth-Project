'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Overlay from 'ol/Overlay';
import React from 'react';

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

export default function MapLeafletClient() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<Map | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [popupContent, setPopupContent] = useState<string>('');
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        setTransactions((data.transactions || []).filter((tx: any) => tx.lat && tx.lng));
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    // Clean up previous map instance
    if (mapObj.current) {
      mapObj.current.setTarget(undefined);
      mapObj.current = null;
    }
    // Create vector features for transactions
    const features = transactions.map((tx) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([tx.lng, tx.lat])),
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
      feature.setStyle(
        new Style({
          image: new Icon({
            src: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
            anchor: [0.5, 0.5],
            scale: 1,
          }),
        })
      );
      return feature;
    });
    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({ source: vectorSource });
    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
      controls: [],
    });
    mapObj.current = map;
    // Popup overlay
    let overlay: Overlay | null = null;
    if (overlayRef.current) {
      overlay = new Overlay({
        element: overlayRef.current,
        autoPan: true,
      });
      map.addOverlay(overlay);
    }
    // Click handler for popups
    map.on('singleclick', function (evt) {
      setPopupOpen(false);
      if (!overlay) return;
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
      } else {
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
      view.setZoom(view.getZoom()! + 1);
    }
  };
  const handleZoomOut = () => {
    if (mapObj.current) {
      const view = mapObj.current.getView();
      view.setZoom(view.getZoom()! - 1);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
          <span className="text-base md:text-lg font-semibold">Transaction Map</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
          <div className="h-[300px] w-full rounded-lg overflow-hidden relative">
            {/* Zoom controls */}
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleZoomIn}
                style={{
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
                }}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={handleZoomOut}
                style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  width: 32,
                  height: 32,
                  fontSize: 20,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
                aria-label="Zoom out"
              >
                -
              </button>
            </div>
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
          ) : (
              <>
                <div ref={mapRef} style={{ width: '100%', height: 300 }} />
                <div
                  ref={overlayRef}
                  style={{
                    position: 'absolute',
                    background: 'white',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    padding: 12,
                    minWidth: 120,
                    pointerEvents: 'auto',
                    zIndex: 10,
                    display: popupOpen ? 'block' : 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: popupContent }}
                />
              </>
            )}
          </div>
          {/* Recent Transactions List below the map */}
          {transactions.length > 0 && !loading && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="font-semibold text-sm mb-2 text-gray-700">Recent Transaction Locations</div>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs cursor-pointer hover:bg-purple-50 transition"
                    onClick={() => {
                      if (mapObj.current) {
                        const view = mapObj.current.getView();
                        const coord = fromLonLat([tx.lng, tx.lat]);
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
                            mapObj.current.getOverlays().item(0)?.setPosition(coord);
                          }
                        }
                      }
                    }}
                  >
                    <span className="font-medium text-purple-700">₹{tx.amount}</span>
                    <span className="text-gray-600">{tx.location || 'Unknown City'}</span>
                    <span className="text-gray-500">Lat: {tx.lat}</span>
                    <span className="text-gray-500">Lng: {tx.lng}</span>
                      </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
} 
