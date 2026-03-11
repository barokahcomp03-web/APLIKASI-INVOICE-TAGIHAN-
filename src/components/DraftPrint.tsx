import React from 'react';
import { CompanyInfo } from '../types';

interface DraftPrintProps {
  type: 'invoice' | 'receipt';
  company: CompanyInfo;
}

export default function DraftPrint({ type, company }: DraftPrintProps) {
  const isInvoice = type === 'invoice';

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
          <div className="space-y-3">
            <div className="flex justify-end items-center gap-2">
              <span className="text-sm font-bold text-stone-400 uppercase">No:</span>
              <div className="border-b border-stone-300 w-32 h-6"></div>
            </div>
            <div className="flex justify-end items-center gap-2">
              <span className="text-sm font-bold text-stone-400 uppercase">Date:</span>
              <div className="border-b border-stone-300 w-32 h-6"></div>
            </div>
            {isInvoice && (
              <div className="flex justify-end items-center gap-2">
                <span className="text-sm font-bold text-stone-400 uppercase">Due:</span>
                <div className="border-b border-stone-300 w-32 h-6"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-stone-50 p-6 rounded-xl border border-stone-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Bill To:</h3>
          <div className="space-y-4">
            <div className="border-b border-stone-200 w-full h-8"></div>
            <div className="border-b border-stone-200 w-full h-8"></div>
            <div className="border-b border-stone-200 w-full h-8"></div>
          </div>
        </div>
        <div className="flex flex-col justify-end text-right">
          <div className="space-y-4">
            <div className="flex justify-end items-center gap-2">
              <span className="text-sm font-bold text-stone-400 uppercase">Status:</span>
              <div className="border-b border-stone-300 w-32 h-6"></div>
            </div>
            <div className="flex justify-end items-center gap-2">
              <span className="text-sm font-bold text-stone-400 uppercase">Technician:</span>
              <div className="border-b border-stone-300 w-32 h-6"></div>
            </div>
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
          {[...Array(10)].map((_, idx) => (
            <tr key={idx}>
              <td className="py-8 px-2">
                <div className="border-b border-stone-100 w-full h-6"></div>
              </td>
              <td className="py-8 px-2 text-right">
                <div className="border-b border-stone-100 w-full h-6"></div>
              </td>
              <td className="py-8 px-2 text-right">
                <div className="border-b border-stone-100 w-full h-6"></div>
              </td>
              <td className="py-8 px-2 text-right">
                <div className="border-b border-stone-100 w-full h-6"></div>
              </td>
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
            <div className="border-b border-stone-200 w-32 h-6"></div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-stone-100">
            <span className="text-stone-400 font-bold uppercase text-xs">PPN</span>
            <div className="border-b border-stone-200 w-32 h-6"></div>
          </div>
          <div className="flex justify-between items-center py-4 bg-stone-900 text-white px-4 rounded-xl">
            <span className="font-black uppercase text-sm">Total Amount</span>
            <div className="border-b border-white/30 w-32 h-6"></div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-stone-100">
            <span className="text-blue-500 font-bold uppercase text-xs">Uang Muka (DP)</span>
            <div className="border-b border-stone-200 w-32 h-6"></div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-24 grid grid-cols-2 gap-24">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-16">Client Signature</p>
          <div className="border-b border-stone-300 w-48 mx-auto"></div>
          <div className="h-6 mt-2"></div>
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
