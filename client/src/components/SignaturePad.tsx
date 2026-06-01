import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';

export interface SignaturePadHandle {
  toDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Scale for crisp lines on high-DPI screens.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1a1a1a';
    }
  }, []);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
    if (!hasDrawn) setHasDrawn(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    setHasDrawn(false);
  };

  useImperativeHandle(ref, () => ({
    toDataUrl: () => (dirty.current ? canvasRef.current!.toDataURL('image/png') : null),
    clear,
    isEmpty: () => !dirty.current,
  }));

  return (
    <Box>
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: '#fafafa',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          style={{ width: '100%', height: 160, touchAction: 'none', display: 'block' }}
        />
        {!hasDrawn && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ position: 'absolute', top: '50%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', transform: 'translateY(-50%)' }}
          >
            Sign here
          </Typography>
        )}
      </Box>
      <Stack direction="row" justifyContent="flex-end" mt={1}>
        <Button size="small" onClick={clear}>
          Clear
        </Button>
      </Stack>
    </Box>
  );
});

SignaturePad.displayName = 'SignaturePad';
