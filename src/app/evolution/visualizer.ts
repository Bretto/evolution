import {lerp} from 'three/src/math/MathUtils';
import {Level, NeuralNetwork} from './neural-network';


export class Visualizer {
  static drawNetwork(ctx: CanvasRenderingContext2D, network: any) {
    const margin = 50;
    const left = margin;
    const top = margin;
    const width = ctx.canvas.width - margin * 2;
    const height = ctx.canvas.height - margin * 2;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const levelHeight = height / network.levels.length;

    for (let i = network.levels.length - 1; i >= 0; i--) {
      const levelTop = top +
        lerp(
          height - levelHeight,
          0,
          network.levels.length == 1
            ? 0.5
            : i / (network.levels.length - 1)
        );

      // ctx.setLineDash([7, 3]);
      Visualizer.drawLevel(ctx, network.levels[i],
        left, levelTop,
        width, levelHeight,
        i == network.levels.length - 1
          ? ['🠈', '🠊']
          // ? ['🠉', '🠈', '🠊', '🠋']
          : []
      );
    }
  }

  static drawLevel(ctx: CanvasRenderingContext2D, level: any, left: number, top: number, width: number, height: number, outputLabels: string[]) {
    const right = left + width;
    const bottom = top + height;

    const { inputs, outputs, weights, biases } = level;

    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < outputs.length; j++) {
        ctx.beginPath();
        ctx.moveTo(
          Visualizer.getNodeX(inputs, i, left, right),
          bottom
        );
        ctx.lineTo(
          Visualizer.getNodeX(outputs, j, left, right),
          top
        );
        ctx.lineWidth = 1;
        ctx.strokeStyle = getRGBA(weights[i][j], 1);
        // ctx.strokeStyle = "grey";
        ctx.stroke();
      }
    }

    const nodeRadius = 18;
    for (let i = 0; i < inputs.length; i++) {
      const x = Visualizer.getNodeX(inputs, i, left, right);
      ctx.beginPath();
      ctx.arc(x, bottom, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#444444';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, bottom, nodeRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = getRGBA(inputs[i]);
      ctx.fill();
    }

    for (let i = 0; i < outputs.length; i++) {
      const x = Visualizer.getNodeX(outputs, i, left, right);
      ctx.beginPath();
      ctx.arc(x, top, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#444444';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, top, nodeRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = getRGBA(outputs[i]);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.arc(x, top, nodeRadius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = getRGBA(biases[i]);
      // ctx.strokeStyle = "white";
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (outputLabels[i]) {
        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.font = (nodeRadius * 1.2) + "px Arial";
        ctx.fillText(outputLabels[i], x, top + nodeRadius * 0.1);
        ctx.lineWidth = 0.5;
        ctx.strokeText(outputLabels[i], x, top + nodeRadius * 0.1);
      }
    }
  }

  private static getNodeX(nodes: any[], index: number, left: number, right: number) {
    return lerp(
      left,
      right,
      nodes.length == 1
        ? 0.5
        : index / (nodes.length - 1)
    );
  }
}


export function getRGBA(value: any, a = 0) {
  const alpha = Math.abs(value);
  const R = value < 0 ? 0 : 255;
  const G = 255;
  const B = value > 0 ? 0 : 255;
  return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}
