import { Line } from 'react-konva';
import { useEditorStore } from '../../stores/editorStore';

const MM_TO_PX = 3.7795275591;

interface GuidesProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function Guides({ canvasWidth, canvasHeight }: GuidesProps) {
  const { guides } = useEditorStore();

  return (
    <>
      {guides.map((guide, index) => {
        const positionPx = guide.position * MM_TO_PX;
        
        if (guide.orientation === 'horizontal') {
          return (
            <Line
              key={`h-${index}`}
              points={[0, positionPx, canvasWidth, positionPx]}
              stroke="#00a8ff"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          );
        } else {
          return (
            <Line
              key={`v-${index}`}
              points={[positionPx, 0, positionPx, canvasHeight]}
              stroke="#00a8ff"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          );
        }
      })}
    </>
  );
}

export default Guides;
