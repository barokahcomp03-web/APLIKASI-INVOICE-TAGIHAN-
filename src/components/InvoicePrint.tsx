import React from 'react';
import { Submission, CompanyInfo } from '../types';

interface InvoicePrintProps {
  submission: Submission;
  company: CompanyInfo;
}

export default function InvoicePrint({ submission, company }: InvoicePrintProps) {
  const isInvoice = submission.type === 'invoice';

  return (
    <div className="a4-container bg-white text-black p-12 mx-auto shadow-2xl print:shadow-none print:p-0" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-stone-900 pb-8">
        <div className="flex gap-6 items-center">
          {company.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-24 w-auto object-contain" referrerPolicy="no-referrer" />
          )}
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">{company.name}</h1>
            <p className="text-sm text-stone-600 max-w-xs leading-tight whitespace-pre-line">{company.address}</p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
              {company.phone && <div><span className="text-stone-400 uppercase mr-2">Tel:</span> {company.phone}</div>}
              {company.email && <div><span className="text-stone-400 uppercase mr-2">Email:</span> {company.email}</div>}
              {company.website && <div><span className="text-stone-400 uppercase mr-2">Web:</span> {company.website}</div>}
              {company.npwp && <div><span className="text-stone-400 uppercase mr-2">NPWP:</span> {company.npwp}</div>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-stone-200 mb-4">
            {isInvoice ? 'Invoice' : 'Receipt'}
          </h2>
          <div className="space-y-1">
            <p className="text-sm font-bold"><span className="text-stone-400 uppercase mr-2">No:</span> #{submission.id.toString().padStart(6, '0')}</p>
            <p className="text-sm font-bold"><span className="text-stone-400 uppercase mr-2">Date:</span> {new Date(submission.created_at).toLocaleDateString()}</p>
            {isInvoice && (
              <p className="text-sm font-bold text-red-600"><span className="text-stone-400 uppercase mr-2">Due:</span> {submission.due_date}</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-stone-50 p-6 rounded-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Bill To:</h3>
          <p className="text-xl font-black mb-2">{submission.client_name}</p>
          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{submission.client_address}</p>
        </div>
        <div className="flex flex-col justify-end text-right">
          <div className="space-y-2">
            <p className="text-sm"><span className="text-stone-400 uppercase mr-2">Status:</span> <span className="font-black uppercase">{isInvoice ? 'Payment Pending' : 'Paid in Full'}</span></p>
            <p className="text-sm"><span className="text-stone-400 uppercase mr-2">Technician:</span> <span className="font-black">{submission.technician_name}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-12">
        <thead>
          <tr className="border-b-4 border-stone-900">
            <th className="py-4 px-2 text-xs font-black uppercase tracking-widest">Description</th>
            <th className="py-4 px-2 text-xs font-black uppercase tracking-widest text-right w-24">Qty</th>
            <th className="py-4 px-2 text-xs font-black uppercase tracking-widest text-right w-40">Unit Price</th>
            <th className="py-4 px-2 text-xs font-black uppercase tracking-widest text-right w-40">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {submission.items?.map((item, idx) => (
            <tr key={idx}>
              <td className="py-6 px-2">
                <p className="font-black text-lg">{item.item_name}</p>
                <p className="text-sm text-stone-500 mt-1">{item.description}</p>
              </td>
              <td className="py-6 px-2 text-right font-bold">{item.quantity}</td>
              <td className="py-6 px-2 text-right font-bold text-stone-600">Rp {item.price.toLocaleString()}</td>
              <td className="py-6 px-2 text-right font-black text-lg">Rp {(item.quantity * item.price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Totals */}
      <div className="flex justify-between items-start mt-auto">
        <div className="max-w-xs">
          <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Payment Information</h4>
          <div className="text-xs space-y-1 text-stone-600">
            <p><span className="font-bold">Bank:</span> {company.bank_name || '-'}</p>
            <p><span className="font-bold">Account No:</span> {company.bank_account_number || '-'}</p>
            <p><span className="font-bold">Account Name:</span> {company.bank_account_name || '-'}</p>
            <p className="mt-4 italic">
              Please include the invoice number in the transfer reference.
            </p>
          </div>
        </div>
        <div className="w-64 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-stone-100">
            <span className="text-stone-400 font-bold uppercase text-xs">Subtotal</span>
            <span className="font-bold">Rp {(submission.total_amount - (submission.other_costs || 0) - (submission.ppn || 0)).toLocaleString()}</span>
          </div>
          {submission.other_costs > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-stone-400 font-bold uppercase text-xs">{submission.other_costs_description || 'Biaya Lain-lain'}</span>
              <span className="font-bold">Rp {submission.other_costs.toLocaleString()}</span>
            </div>
          )}
          {submission.ppn > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-stone-400 font-bold uppercase text-xs">PPN</span>
              <span className="font-bold">Rp {submission.ppn.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-4 bg-stone-900 text-white px-4 rounded-xl">
            <span className="font-black uppercase text-sm">Total Amount</span>
            <span className="text-xl font-black tracking-tighter">Rp {submission.total_amount.toLocaleString()}</span>
          </div>
          {submission.down_payment > 0 && (
            <>
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <span className="text-blue-500 font-bold uppercase text-xs">Uang Muka (DP)</span>
                <span className="font-bold text-blue-600">Rp {submission.down_payment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <span className="text-stone-400 font-bold uppercase text-xs">Sisa Tagihan</span>
                <span className="font-bold">Rp {(submission.total_amount - submission.down_payment).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Watermark for Payment Status */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-[-35deg] select-none">
        <p className="text-[180px] font-black uppercase tracking-widest">
          {submission.down_payment >= submission.total_amount ? 'PAID' : submission.down_payment > 0 ? 'PARTIAL' : 'UNPAID'}
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-24 grid grid-cols-2 gap-24">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-16">Client Signature</p>
          <div className="border-b border-stone-300 w-48 mx-auto"></div>
          <p className="text-sm font-bold mt-2">{submission.client_name}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">{company.signatory_role || 'Authorized Signatory'}</p>
          {company.signature_url ? (
            <img src={company.signature_url} alt="Signature" className="h-20 mx-auto object-contain mb-4" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-20 mb-4"></div>
          )}
          <div className="border-b border-stone-300 w-48 mx-auto"></div>
          <p className="text-sm font-bold mt-2">{company.signatory_name || 'Manager'}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .a4-container { 
            width: 100% !important; 
            height: auto !important; 
            padding: 0 !important; 
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}
