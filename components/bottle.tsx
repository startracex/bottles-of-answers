import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export interface BottleData {
  id: string;
  answer: string;
  level: number;
  color?: string; // Optional - falls back to global color if not set
}

export interface BottleComponentProps {
  bottle: BottleData;
  effectiveColor: string;
  globalColor: string;
  divisions: number;
  isEditMode: boolean;
  isEditing: boolean;
  isDragging: boolean;
  onEdit: () => void;
  onClick: (isRightClick: boolean) => void;
  onUpdate: (updates: Partial<BottleData>) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function Bottle({
  bottle,
  effectiveColor,
  globalColor,
  divisions,
  isEditMode,
  isEditing,
  isDragging,
  onEdit,
  onClick,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: BottleComponentProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditMode && !isEditing) {
      onEdit();
    } else if (!isEditMode) {
      onClick(false);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      onClick(true);
    }
  };

  const handleLevelChange = (increment: number) => {
    const currentStep = Math.round((bottle.level / 100) * divisions);
    const newStep = Math.max(0, Math.min(divisions, currentStep + increment));
    const newLevel = (newStep / divisions) * 100;
    onUpdate({ level: newLevel });
  };

  const handleColorChange = (newColor: string) => {
    if (newColor === globalColor) {
      // If setting to global color, remove individual color
      onUpdate({ color: undefined });
    } else {
      onUpdate({ color: newColor });
    }
  };

  return (
    <div
      className={`pt-4 flex flex-col items-center space-y-2 relative ${isDragging ? "opacity-50" : ""}`}
      draggable={isEditMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle - Upper Right Corner */}
      {isEditMode && (
        <div
          className="absolute top-0 right-0 z-10 p-1 cursor-grab active:cursor-grabbing bg-gray-200 rounded-bl-lg border border-gray-300 hover:bg-gray-300 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-gray-600" />
        </div>
      )}

      {/* Bottle */}
      <div
        className="flex flex-col items-center w-20 h-32 cursor-pointer transition-transform hover:scale-105"
        onClick={handleClick}
        onContextMenu={handleRightClick}
      >
        {/* Bottle Neck - wider (more than 80% of body width) */}
        <div className="w-12 h-4 bg-gray-300 border-2 border-gray-400 rounded-t-lg"></div>
        {/* Bottle Shape - rounded on all sides */}
        <div className="relative overflow-hidden flex-1 w-full bg-gray-200 rounded-lg border-2 border-gray-300">
          {/* Liquid - rounded to match bottle shape */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out"
            style={{
              height: `${bottle.level}%`,
              backgroundColor: effectiveColor,
              opacity: 0.8,
            }}
          >
            {/* Liquid Surface Effect */}
            <div
              className="transform -translate-y-1/2 absolute top-0 left-0 right-0 rounded-full"
              style={{
                backgroundColor: effectiveColor,
                opacity: 0.6,
                height: `${bottle.level > 0 ? 4 : 0}px`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Answer Label */}
      {isEditing ? (
        <div
          className="space-y-2 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            value={bottle.answer}
            onChange={(e) => onUpdate({ answer: e.target.value })}
            className="text-center text-sm"
            placeholder="Answer"
          />
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={effectiveColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-8"
            />
            <Button
              onClick={() => onUpdate({ color: undefined })}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={!bottle.color}
            >
              Use Global
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => handleLevelChange(-1)}
              variant="outline"
              size="sm"
              disabled={bottle.level <= 0}
              className="w-8 h-8 p-0"
            >
              -
            </Button>
            <span className="text-xs text-center min-w-12">
              {Math.round((bottle.level / 100) * divisions)}/{divisions}
            </span>
            <Button
              onClick={() => handleLevelChange(1)}
              variant="outline"
              size="sm"
              disabled={bottle.level >= 100}
              className="w-8 h-8 p-0"
            >
              +
            </Button>
          </div>
          <Button
            onClick={onRemove}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <span className="text-sm font-medium text-gray-700 text-center px-2">{bottle.answer}</span>
      )}
    </div>
  );
}
