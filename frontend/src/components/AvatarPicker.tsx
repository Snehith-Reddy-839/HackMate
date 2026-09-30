'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AvatarDisplay, { ANIMAL_AVATARS, ANIMAL_KEYS } from './AvatarDisplay';
import { Upload, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar?: string | null;
  onSelect: (avatarString: string) => void;
  triggerButton?: React.ReactNode;
}

export default function AvatarPicker({
  currentAvatar,
  onSelect,
  triggerButton,
}: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentAvatar || ANIMAL_KEYS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChooseAnimal = (key: string) => {
    setSelected(key);
    onSelect(key);
    setOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelected(dataUrl);
      onSelect(dataUrl);
      setOpen(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors gap-1.5">
        {triggerButton || (
          <>
            <Sparkles size={14} /> Change Avatar
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="text-primary" size={20} /> Choose Profile Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Choose an Illustrated Animal
            </div>
            <div className="grid grid-cols-5 gap-3">
              {ANIMAL_KEYS.map((key) => {
                const isSelected = selected === key;
                const animal = ANIMAL_AVATARS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChooseAnimal(key)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5 scale-105 shadow-sm'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <AvatarDisplay avatar={key} size="lg" />
                    <span className="text-xs font-medium text-gray-700">{animal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ImageIcon size={14} /> Or Upload Custom Photo
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Upload Photo from Computer (Max 2MB)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
