'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * FAQ item type
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */
export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  order: number;
}

/**
 * Props for FAQManager component
 */
interface FAQManagerProps {
  items: FAQItem[];
  onChange: (items: FAQItem[]) => void;
}

/**
 * Props for SortableItem component
 */
interface SortableItemProps {
  item: FAQItem;
  index: number;
  isEditing: boolean;
  editQuestion: string;
  editAnswer: string;
  onEditQuestion: (value: string) => void;
  onEditAnswer: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

/**
 * Sortable FAQ item component
 * Requirement: 6.4
 */
function SortableItem({
  item,
  index,
  isEditing,
  editQuestion,
  editAnswer,
  onEditQuestion,
  onEditAnswer,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      {isEditing ? (
        // Edit mode
        <div className="space-y-3">
          <div>
            <label
              htmlFor={`faq-question-${index}`}
              className="block text-sm font-medium mb-1"
            >
              Question <span className="text-red-500">*</span>
            </label>
            <Input
              id={`faq-question-${index}`}
              type="text"
              value={editQuestion}
              onChange={(e) => onEditQuestion(e.target.value)}
              placeholder="Enter FAQ question"
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor={`faq-answer-${index}`}
              className="block text-sm font-medium mb-1"
            >
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              id={`faq-answer-${index}`}
              value={editAnswer}
              onChange={(e) => onEditAnswer(e.target.value)}
              placeholder="Enter FAQ answer"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onSave}
              size="sm"
              disabled={!editQuestion.trim() || !editAnswer.trim()}
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // View mode
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                #{index + 1}
              </span>
              <h4 className="font-semibold text-gray-900 break-words">
                {item.question || '(Empty question)'}
              </h4>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
              {item.answer || '(Empty answer)'}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              type="button"
              onClick={onEdit}
              variant="outline"
              size="sm"
              aria-label={`Edit FAQ item ${index + 1}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={onDelete}
              variant="outline"
              size="sm"
              aria-label={`Delete FAQ item ${index + 1}`}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * FAQManager component for managing FAQ items
 * Provides add, edit, delete, and reorder functionality
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export function FAQManager({ items, onChange }: FAQManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Add a new FAQ item
   * Requirement: 6.2
   */
  const handleAdd = () => {
    const newItem: FAQItem = {
      question: '',
      answer: '',
      order: items.length,
    };
    onChange([...items, newItem]);
    setEditingIndex(items.length);
    setEditQuestion('');
    setEditAnswer('');
  };

  /**
   * Start editing an FAQ item
   * Requirement: 6.5
   */
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditQuestion(items[index].question);
    setEditAnswer(items[index].answer);
  };

  /**
   * Save edited FAQ item
   * Requirement: 6.5
   */
  const handleSave = (index: number) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      return;
    }

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    };
    onChange(updatedItems);
    setEditingIndex(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  /**
   * Cancel editing
   */
  const handleCancel = (index: number) => {
    // If it's a new item with empty fields, remove it
    if (!items[index].question && !items[index].answer) {
      const updatedItems = items.filter((_, i) => i !== index);
      // Update order for remaining items
      const reorderedItems = updatedItems.map((item, i) => ({
        ...item,
        order: i,
      }));
      onChange(reorderedItems);
    }
    setEditingIndex(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  /**
   * Delete an FAQ item with confirmation
   * Requirement: 6.6
   */
  const handleDelete = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Update order for remaining items
    const reorderedItems = updatedItems.map((item, i) => ({
      ...item,
      order: i,
    }));
    onChange(reorderedItems);
    setDeleteIndex(null);
  };

  /**
   * Handle drag end event to reorder items
   * Requirement: 6.4
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);

      const reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, i) => ({
        ...item,
        order: i,
      }));

      onChange(reorderedItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">FAQ Items</h3>
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          No FAQ items yet. Click "Add FAQ Item" to create one.
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((_, index) => index.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableItem
                  key={index}
                  item={item}
                  index={index}
                  isEditing={editingIndex === index}
                  editQuestion={editQuestion}
                  editAnswer={editAnswer}
                  onEditQuestion={setEditQuestion}
                  onEditAnswer={setEditAnswer}
                  onEdit={() => handleEdit(index)}
                  onSave={() => handleSave(index)}
                  onCancel={() => handleCancel(index)}
                  onDelete={() => setDeleteIndex(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this FAQ item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteIndex !== null && (
            <div className="my-4 p-4 bg-gray-50 rounded-md">
              <p className="font-semibold text-sm mb-1">
                {items[deleteIndex]?.question}
              </p>
              <p className="text-sm text-gray-600">
                {items[deleteIndex]?.answer}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteIndex(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => deleteIndex !== null && handleDelete(deleteIndex)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
