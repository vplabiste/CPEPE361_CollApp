
'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Application, DocumentStatus, SubmittedDocument } from '@/lib/college-schemas';
import { format } from 'date-fns';
import { CheckCircle, Clock, Eye, Save, Send, AlertTriangle, XCircle, NotebookText } from 'lucide-react';
import { batchUpdateDocumentStatuses, updateOverallApplicationStatus } from '@/app/actions/schoolrep';
import { isEqual } from 'lodash';

interface ApplicantCardProps {
  application: Application;
  onUpdate: () => void;
}

const statusBadgeVariant = {
  'Under Review': 'secondary',
  'Accepted': 'default',
  'Rejected': 'destructive',
} as const;

const docStatusIcons: { [key in DocumentStatus]: React.ReactNode } = {
  'Pending': <Clock className="h-4 w-4 text-gray-500" />,
  'Accepted': <CheckCircle className="h-4 w-4 text-green-500" />,
  'Rejected': <XCircle className="h-4 w-4 text-red-500" />,
  'Resubmit': <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export function ApplicantCard({ application, onUpdate }: ApplicantCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [decisionMessage, setDecisionMessage] = useState(application.finalMessage || '');
  const [finalProgram, setFinalProgram] = useState('');
  const [documentUpdates, setDocumentUpdates] = useState<SubmittedDocument[]>(application.documents);
  const isDecided = application.status !== 'Under Review';

  const areDocumentsChanged = useMemo(() => {
    return !isEqual(application.documents, documentUpdates);
  }, [application.documents, documentUpdates]);

  const allDocumentsAccepted = useMemo(() => {
    return documentUpdates.every(doc => doc.status === 'Accepted');
  }, [documentUpdates]);

  const handleDocUpdate = (docId: string, newStatus: DocumentStatus, newNote?: string) => {
    setDocumentUpdates(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === docId) {
          const updatedDoc = { ...doc, status: newStatus };
          if (newStatus === 'Resubmit') {
            updatedDoc.resubmissionNote = newNote;
          }
          if (newStatus !== 'Resubmit' && 'resubmissionNote' in updatedDoc) {
             updatedDoc.resubmissionNote = newNote ?? doc.resubmissionNote;
          }
          return updatedDoc;
        }
        return doc;
      });
    });
  };

  const handleSaveDocStatuses = () => {
    const changedDocs = documentUpdates.filter((updatedDoc, index) => {
        return !isEqual(updatedDoc, application.documents[index]);
    }).map(doc => ({
        documentId: doc.id,
        status: doc.status,
        note: doc.resubmissionNote
    }));

    if (changedDocs.length === 0) return;

    startTransition(async () => {
        const result = await batchUpdateDocumentStatuses(application.id, changedDocs);
        if (result.success) {
            toast({ title: 'Success', description: 'Document statuses updated.' });
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }

  const handleDecision = (status: 'Accepted' | 'Rejected') => {
      if (status === 'Accepted' && !finalProgram) {
          toast({ variant: 'destructive', title: 'Program Required', description: 'Please select a final program for the applicant.'});
          return;
      }
      if (!decisionMessage) {
          toast({ variant: 'destructive', title: 'Message Required', description: 'Please provide a message for the applicant.'});
          return;
      }
      startTransition(async () => {
          const result = await updateOverallApplicationStatus(application.id, status, decisionMessage, finalProgram, documentUpdates);
          if (result.success) {
              toast({ title: 'Success', description: result.message });
              onUpdate();
          } else {
              toast({ variant: 'destructive', title: 'Error', description: result.message });
          }
      });
  }

  const programChoices = [application.firstChoiceProgram, application.secondChoiceProgram].filter(Boolean) as string[];

  return (
    <AccordionItem value={application.id}>
      <AccordionTrigger>
        <div className="flex justify-between items-center w-full pr-4">
          <div className="flex items-center gap-4">
            <Image
              src={application.studentInfo.profilePictureUrl || `https://placehold.co/40x40.png`}
              alt="Student Avatar"
              width={40}
              height={40}
              className="rounded-full object-cover"
              data-ai-hint="profile avatar"
            />
            <div className="text-left">
              <p className="font-semibold">{application.studentInfo.name}</p>
              <p className="text-sm text-muted-foreground">{application.studentInfo.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={statusBadgeVariant[application.status]}>{application.status}</Badge>
            <p className="text-xs text-muted-foreground">
              Applied: {format(new Date(application.submittedAt), 'PPP')}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 bg-muted/50 rounded-b-md space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><NotebookText/> Program Choices</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="font-medium">1st Choice Program:</div>
                <div className="text-muted-foreground">{application.firstChoiceProgram || 'Not specified'}</div>
                <div className="font-medium">2nd Choice Program:</div>
                <div className="text-muted-foreground">{application.secondChoiceProgram || 'None'}</div>
            </CardContent>
        </Card>
        
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold">Submitted Documents</h3>
                {areDocumentsChanged && !isDecided && (
                    <Button size="sm" onClick={handleSaveDocStatuses} disabled={isPending}>
                        <Save className="mr-2 h-4 w-4"/> Save Document Statuses
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentUpdates.map((doc) => (
                <DocumentReviewCard 
                key={doc.id} 
                doc={doc} 
                onStatusChange={(status) => handleDocUpdate(doc.id, status, doc.resubmissionNote)}
                onNoteChange={(note) => handleDocUpdate(doc.id, doc.status, note)}
                isDecided={isDecided}
                />
            ))}
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send/> Final Decision</CardTitle>
                 <CardDescription>This action is final and will lock the application from further edits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isDecided && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Final Program Assignment</label>
                            <Select value={finalProgram} onValueChange={setFinalProgram} disabled={isPending}>
                                <SelectTrigger><SelectValue placeholder="Select a program..."/></SelectTrigger>
                                <SelectContent>
                                    {programChoices.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <p className="text-xs text-muted-foreground mt-1">Required for acceptance.</p>
                        </div>
                    </div>
                )}
                <Textarea 
                    placeholder="Write a final message to the applicant (e.g., congratulations, next steps, or reasons for rejection)..."
                    value={decisionMessage}
                    onChange={(e) => setDecisionMessage(e.target.value)}
                    disabled={isPending || isDecided}
                />
                <div className="flex gap-4">
                    <Button 
                        onClick={() => handleDecision('Accepted')}
                        disabled={isPending || isDecided || !allDocumentsAccepted} 
                        className="bg-success hover:bg-success/90 text-success-foreground"
                    >
                        Accept Application
                    </Button>
                    <Button 
                        onClick={() => handleDecision('Rejected')}
                        disabled={isPending || isDecided} 
                        variant="destructive"
                    >
                        Reject Application
                    </Button>
                </div>
                 {!isDecided && !allDocumentsAccepted && (
                    <p className="text-xs text-orange-600">You cannot accept this application until all documents are marked as "Accepted".</p>
                 )}
                 {isDecided && (
                    <p className="text-sm text-muted-foreground">
                      A final decision was made on {application.decisionDate ? format(new Date(application.decisionDate), 'PPP') : 'N/A'}. <br/>
                      Accepted Program: <span className="font-semibold">{application.finalProgram || 'N/A'}</span>
                    </p>
                )}
            </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
}

function DocumentReviewCard({ doc, onStatusChange, onNoteChange, isDecided }: { 
    doc: SubmittedDocument, 
    onStatusChange: (status: DocumentStatus) => void,
    onNoteChange: (note: string) => void,
    isDecided: boolean 
}) {
    return (
        <Card className="bg-background">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        {docStatusIcons[doc.status]} {doc.label}
                    </span>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><Eye className="mr-2"/> View</Button>
                    </a>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Select value={doc.status} onValueChange={(s: DocumentStatus) => onStatusChange(s)} disabled={isDecided}>
                    <SelectTrigger><SelectValue placeholder="Update status..."/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Resubmit">Needs Resubmission</SelectItem>
                    </SelectContent>
                </Select>
                {doc.status === 'Resubmit' && (
                    <div className="space-y-2">
                        <label htmlFor={`note-${doc.id}`} className="text-sm font-medium flex items-center gap-1.5">Note for Student</label>
                        <Textarea id={`note-${doc.id}`} placeholder="e.g., Please upload a clearer copy." value={doc.resubmissionNote || ''} onChange={(e) => onNoteChange(e.target.value)} disabled={isDecided} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
