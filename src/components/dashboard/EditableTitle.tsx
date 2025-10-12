import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateTranscriptTitle } from "@/hooks/useUpdateTranscriptTitle";

interface EditableTitleProps {
  transcriptId: string;
  currentTitle: string;
  className?: string;
}

export function EditableTitle({ transcriptId, currentTitle, className = "" }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateMutation = useUpdateTranscriptTitle();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(currentTitle);
  }, [currentTitle]);

  const handleSave = async () => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setValue(currentTitle);
      setIsEditing(false);
      return;
    }

    if (trimmedValue === currentTitle) {
      setIsEditing(false);
      return;
    }

    await updateMutation.mutateAsync({
      transcriptId,
      newTitle: trimmedValue
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(currentTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm font-medium"
          disabled={updateMutation.isPending}
        />
        <Button 
          size="sm" 
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          <Check className="h-3.5 w-3.5 text-green-600" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleCancel}
          disabled={updateMutation.isPending}
        >
          <X className="h-3.5 w-3.5 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/title">
      <h4 className={`font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-sm ${className}`}>
        {currentTitle}
      </h4>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
        aria-label="Edit title"
      >
        <Pencil className="h-3 w-3 text-slate-400 hover:text-blue-600" />
      </button>
    </div>
  );
}
