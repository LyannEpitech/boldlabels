import { Line, Rect } from 'react-konva';
import { useEditorStore } from '../../stores/editorStore';

const MM_TO_PX = 3.7795275591;
const GUIDE_COLOR = '#6366F1'; // brand-500
const GUIDE_HIT_AREA = 10; // pixels

interface GuidesProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function Guides({ canvasWidth, canvasHeight }: GuidesProps) {
  const { guides, removeGuide } = useEditorStore();

  return (
    <>
      {guides.map((guide, index) => {
        const positionPx = guide.position * MM_TO_PX;
        
        if (guide.orientation === 'horizontal') {
          return (
            <>
              {/* Hit area for interaction */}
              <Rect
                x={0}
                y={positionPx - GUIDE_HIT_AREA / 2}
                width={canvasWidth}
                height={GUIDE_HIT_AREA}
                fill="transparent"
                onDblClick={() => removeGuide(index)}
                style={{ cursor: 'pointer' }}
              />
              {/* Visible guide line */}
              <Line
                key={`h-${index}`}
                points={[0, positionPx, canvasWidth, positionPx]}
                stroke={GUIDE_COLOR}
                strokeWidth={1}
                dash={[4, 4]}
              />
            </>
          );
        } else {
          return (
            <>
              {/* Hit area for interaction */}
              <Rect
                x={positionPx - GUIDE_HIT_AREA / 2}
                y={0}
                width={GUIDE_HIT_AREA}
                height={canvasHeight}
                fill="transparent"
                onDblClick={() => removeGuide(index)}
                style={{ cursor: 'pointer' }}
              />
              {/* Visible guide line */}
              <Line
                key={`v-${index}`}
                points={[positionPx, 0, positionPx, canvasHeight]}
                stroke={GUIDE_COLOR}
                strokeWidth={1}
                dash={[4, 4]}
              />
            </>
          );
        }
      })}
    </>
  );
}

export default Guides;
