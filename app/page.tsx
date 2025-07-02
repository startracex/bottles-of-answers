"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Download, Upload, Edit3, Save, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import data from "../bottles.json";
import Link from "next/link";
import { Bottle, BottleData } from "@/components/bottle";

let { editMode, ...defaultData } = data;

editMode = editMode === false ? false : true;

interface AppData {
  bottles: BottleData[];
  settings: {
    divisions: number; // Number of equal parts (replaces fillIncrement)
    maxLevel: number;
    minLevel: number;
    globalColor: string;
  };
}

export default function InteractiveBottles() {
  const [data, setData] = useState<AppData>(defaultData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBottle, setEditingBottle] = useState<string | null>(null);
  const [draggedBottle, setDraggedBottle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to snap fill levels to equal divisions
  const snapToDivision = (value: number, divisions: number): number => {
    const step = 100 / divisions;
    const steps = Array.from({ length: divisions + 1 }, (_, i) => i * step);
    return steps.reduce((prev, curr) => (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev));
  };

  // Get effective color for a bottle (individual color or global fallback)
  const getBottleColor = (bottle: BottleData): string => {
    return bottle.color || data.settings.globalColor;
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Save and exit edit mode
      setEditingBottle(null);
      setDraggedBottle(null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleBottleClick = (bottleId: string, isRightClick = false) => {
    if (isEditMode) return;

    setData((prev) => ({
      ...prev,
      bottles: prev.bottles.map((bottle) => {
        if (bottle.id === bottleId) {
          const increment = (100 / prev.settings.divisions) * (isRightClick ? -1 : 1);
          let newLevel = bottle.level + increment;

          // Clamp to bounds
          newLevel = Math.max(prev.settings.minLevel, Math.min(prev.settings.maxLevel, newLevel));

          // Snap to clean divisions
          newLevel = snapToDivision(newLevel, prev.settings.divisions);

          return { ...bottle, level: newLevel };
        }
        return bottle;
      }),
    }));
  };

  const addBottle = () => {
    const newBottle: BottleData = {
      id: crypto.randomUUID(),
      answer: "New Answer",
      level: 0,
    };
    setData((prev) => ({
      ...prev,
      bottles: [...prev.bottles, newBottle],
    }));
  };

  const removeBottle = (bottleId: string) => {
    setData((prev) => ({
      ...prev,
      bottles: prev.bottles.filter((bottle) => bottle.id !== bottleId),
    }));
  };

  const updateBottle = (bottleId: string, updates: Partial<BottleData>) => {
    setData((prev) => ({
      ...prev,
      bottles: prev.bottles.map((bottle) => (bottle.id === bottleId ? { ...bottle, ...updates } : bottle)),
    }));
  };

  const updateGlobalColor = (color: string) => {
    setData((prev) => ({
      ...prev,
      globalColor: color,
    }));
  };

  const resetAllBottles = () => {
    setData((prev) => ({
      ...prev,
      bottles: prev.bottles.map((bottle) => ({
        ...bottle,
        level: defaultData.bottles.find((b) => b.id === bottle.id)?.level ?? 0,
      })),
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bottles-export.json";
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setData(importedData);
        setIsEditMode(false);
        setEditingBottle(null);
      } catch {}
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, bottleId: string) => {
    setDraggedBottle(bottleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetBottleId: string) => {
    e.preventDefault();

    if (!draggedBottle || draggedBottle === targetBottleId) {
      setDraggedBottle(null);
      return;
    }

    setData((prev) => {
      const bottles = [...prev.bottles];
      const draggedIndex = bottles.findIndex((bottle) => bottle.id === draggedBottle);
      const targetIndex = bottles.findIndex((bottle) => bottle.id === targetBottleId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remove dragged bottle and insert at target position
      const [draggedBottleData] = bottles.splice(draggedIndex, 1);
      bottles.splice(targetIndex, 0, draggedBottleData);

      return { ...prev, bottles };
    });

    setDraggedBottle(null);
  };

  const handleDragEnd = () => {
    setDraggedBottle(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Controls - in upper left */}
        <div className="flex flex-wrap justify-end gap-2 mb-8 ml-a">
          {editMode && (
            <Button
              onClick={toggleEditMode}
              variant={isEditMode ? "default" : "outline"}
            >
              {isEditMode ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditMode ? "Save" : "Edit"}
            </Button>
          )}

          <Button
            onClick={resetAllBottles}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <Button
            onClick={exportData}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </div>

        {/* Settings Panel (Edit Mode) */}
        {isEditMode && (
          <Card className="mb-8 max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-8">
              <div>
                <Label htmlFor="globalColor">Global Bottle Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="globalColor"
                    type="color"
                    value={data.settings.globalColor}
                    onChange={(e) => updateGlobalColor(e.target.value)}
                    className="w-16 h-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="divisions">Equal Divisions</Label>
                <Input
                  id="divisions"
                  type="number"
                  value={data.settings.divisions}
                  onChange={(e) => {
                    const newDivisions = Math.max(2, Number(e.target.value));
                    setData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, divisions: newDivisions },
                      bottles: prev.bottles.map((bottle) => ({
                        ...bottle,
                        level: snapToDivision(bottle.level, newDivisions),
                      })),
                    }));
                  }}
                  min="2"
                  max="10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {data.bottles.map((bottle) => (
            <Bottle
              key={bottle.id}
              bottle={bottle}
              effectiveColor={getBottleColor(bottle)}
              globalColor={data.settings.globalColor}
              divisions={data.settings.divisions}
              isEditMode={isEditMode}
              isEditing={editingBottle === bottle.id}
              isDragging={draggedBottle === bottle.id}
              onEdit={() => setEditingBottle(editingBottle === bottle.id ? null : bottle.id)}
              onClick={(isRightClick) => handleBottleClick(bottle.id, isRightClick)}
              onUpdate={(updates) => updateBottle(bottle.id, updates)}
              onRemove={() => removeBottle(bottle.id)}
              onDragStart={(e) => handleDragStart(e, bottle.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, bottle.id)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {/* Add Bottle Button at the end */}
          {isEditMode && (
            <div className="pt-4 flex flex-col items-center justify-center">
              <Button
                onClick={addBottle}
                variant="outline"
                className="w-20 h-32 border-2 border-dashed border-gray-400 hover:border-gray-600 flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-gray-50"
              >
                <Plus className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500">Add Bottle</span>
              </Button>
            </div>
          )}
        </div>

        <Link
          href="https://github.com/startracex"
          target="_blank"
        >
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>&copy;&nbsp;{new Date().getFullYear()}&nbsp;&nbsp;STARTRACEX</p>
            <p>Under the MIT License</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
