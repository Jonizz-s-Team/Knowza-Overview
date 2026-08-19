import React from 'react';
import './KnowzaAILoader.css';

const KnowzaAILoader = ({ fullscreen = true }) => {
  return (
    <div className={`knowza-ai-loader-wrapper ${fullscreen ? '' : 'inline'}`}>
      <div className="knowza-cloud-loader">
        <svg id="cloud" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <filter id="roundness">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
              <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10" />
            </filter>
            <mask id="shapes">
              <g fill="white">
                <polygon points="50 37.5 80 75 20 75 50 37.5" />
                <circle cx={20} cy={60} r={15} />
                <circle cx={80} cy={60} r={15} />
                <g>
                  <circle cx={20} cy={60} r={15} />
                  <circle cx={20} cy={60} r={15} />
                  <circle cx={20} cy={60} r={15} />
                </g>
              </g>
            </mask>
            <mask id="clipping" clipPathUnits="userSpaceOnUse">
              <g id="lines" filter="url(#roundness)">
                <g mask="url(#shapes)" stroke="white">
                  <line x1={-50} y1={-40} x2={150} y2={-40} />
                  <line x1={-50} y1={-31} x2={150} y2={-31} />
                  <line x1={-50} y1={-22} x2={150} y2={-22} />
                  <line x1={-50} y1={-13} x2={150} y2={-13} />
                  <line x1={-50} y1={-4} x2={150} y2={-4} />
                  <line x1={-50} y1={5} x2={150} y2={5} />
                  <line x1={-50} y1={14} x2={150} y2={14} />
                  <line x1={-50} y1={23} x2={150} y2={23} />
                  <line x1={-50} y1={32} x2={150} y2={32} />
                  <line x1={-50} y1={41} x2={150} y2={41} />
                  <line x1={-50} y1={50} x2={150} y2={50} />
                  <line x1={-50} y1={59} x2={150} y2={59} />
                  <line x1={-50} y1={68} x2={150} y2={68} />
                  <line x1={-50} y1={77} x2={150} y2={77} />
                  <line x1={-50} y1={86} x2={150} y2={86} />
                  <line x1={-50} y1={95} x2={150} y2={95} />
                  <line x1={-50} y1={104} x2={150} y2={104} />
                  <line x1={-50} y1={113} x2={150} y2={113} />
                  <line x1={-50} y1={122} x2={150} y2={122} />
                  <line x1={-50} y1={131} x2={150} y2={131} />
                  <line x1={-50} y1={140} x2={150} y2={140} />
                </g>
              </g>
            </mask>
          </defs>
          <rect x={0} y={0} width={100} height={100} rx={0} ry={0} mask="url(#clipping)" />
        </svg>
      </div>
    </div>
  );
};

export default KnowzaAILoader;
