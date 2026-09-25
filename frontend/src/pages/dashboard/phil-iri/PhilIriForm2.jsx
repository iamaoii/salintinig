import React, { useState, useMemo, useEffect } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { PhilIriForm2Skeleton } from '../../../components/common/Skeleton.jsx';
import { getApiUrl } from '../../../config/api.js';
import { getToken } from '../../../lib/auth.js';
import cacheService from '../../../services/cacheService.js';
import * as XLSX from 'xlsx';

export default function PhilIriForm2() {
  const [toastMessage, setToastMessage] = useState(null);
  const [rowsData, setRowsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSyId, setSelectedSyId] = useState('');
  const [dbSchoolInfo, setDbSchoolInfo] = useState({
    school: '',
    division: '',
    district: '',
    region: '',
    principalName: '',
  });

  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ message: msg, type });
  };

  // Fetch school years list on mount with caching
  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const token = getToken();
        const cacheKey = 'form2_school_years';
        let data = cacheService.get(cacheKey);

        if (!data) {
          const res = await fetch(getApiUrl('/api/admin/school-years'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          data = await res.json();
          if (res.ok && data.success) {
            cacheService.set(cacheKey, data, 300000); // 5 mins TTL
          }
        }

        if (data && data.success && Array.isArray(data.schoolYears)) {
          setSchoolYears(data.schoolYears);
          const activeSy = data.schoolYears.find((sy) => sy.is_active || sy.isActive) || data.schoolYears[0];
          if (activeSy) {
            setSelectedSyId(activeSy.id || activeSy.school_year_id);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch school years:', e);
      }
    };
    fetchSchoolYears();
  }, []);

  // Fetch school info, principal, and all registered sections across Grade IV, V, VI from backend DB
  useEffect(() => {
    const fetchForm2Data = async () => {
      try {
        setLoading(true);
        const token = getToken();

        // 1 & 2. Fetch Students & Sections in Parallel for Maximum Speed
        const stdCacheKey = 'form2_admin_students';
        const secCacheKey = 'form2_admin_sections';

        let stdData = cacheService.get(stdCacheKey);
        let secData = cacheService.get(secCacheKey);

        const fetchPromises = [];
        if (!stdData) {
          fetchPromises.push(
            fetch(getApiUrl('/api/admin/students'), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then((r) => r.json())
              .then((d) => {
                if (d && d.success) cacheService.set(stdCacheKey, d, 180000);
                return d;
              })
          );
        } else {
          fetchPromises.push(Promise.resolve(stdData));
        }

        if (!secData) {
          fetchPromises.push(
            fetch(getApiUrl('/api/admin/sections'), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then((r) => r.json())
              .then((d) => {
                if (d && d.success) cacheService.set(secCacheKey, d, 180000);
                return d;
              })
          );
        } else {
          fetchPromises.push(Promise.resolve(secData));
        }

        const [resolvedStdData, resolvedSecData] = await Promise.all(fetchPromises);
        stdData = resolvedStdData;
        secData = resolvedSecData;

        if (stdData && stdData.success) {
          setDbSchoolInfo({
            school: stdData.schoolName || stdData.school_name || '',
            division: stdData.division || '',
            district: stdData.district || '',
            region: stdData.region || '',
            principalName: stdData.principalName || stdData.principal_name || '',
          });
        }

        const sectionsList = secData && secData.success && Array.isArray(secData.sections) ? secData.sections : [];
        const studentsList = stdData?.students || [];

        // Build Grade Groups (IV, V, VI) for ALL registered sections
        const gradeGroups = {
          'IV': {},
          'V': {},
          'VI': {},
        };

        // Initialize registered sections first
        sectionsList.forEach((sec) => {
          const gName = sec.gradeLevel || sec.grade_level || '';
          let gKey = 'IV';
          if (gName.includes('5')) gKey = 'V';
          else if (gName.includes('6')) gKey = 'VI';

          const sName = sec.sectionName || sec.section_name || sec.name;
          if (sName) {
            gradeGroups[gKey][sName] = { enrolment: 0, above14: 0, below14: 0 };
          }
        });

        // Count actual enrolled students per section
        studentsList.forEach((s) => {
          const grade = s.grade || s.gradeLevel || '';
          const section = s.section || s.sectionName || '';
          if (!grade || !section) return;

          let gradeKey = 'IV';
          if (grade.includes('5')) gradeKey = 'V';
          else if (grade.includes('6')) gradeKey = 'VI';

          if (!gradeGroups[gradeKey]) gradeGroups[gradeKey] = {};
          if (!gradeGroups[gradeKey][section]) {
            gradeGroups[gradeKey][section] = { enrolment: 0, above14: 0, below14: 0 };
          }

          gradeGroups[gradeKey][section].enrolment += 1;
        });

        // Fetch saved GST submission scores concurrently using Promise.all
        try {
          const allSections = [];
          Object.keys(gradeGroups).forEach((gK) => {
            Object.keys(gradeGroups[gK]).forEach((sec) => allSections.push({ gradeKey: gK, section: sec }));
          });

          await Promise.all(
            allSections.map(async (item) => {
              let subUrl = `/api/admin/phil-iri/gst-submission?sectionName=${encodeURIComponent(item.section)}&language=Tagalog`;
              if (selectedSyId) subUrl += `&schoolYearId=${selectedSyId}`;

              const subCacheKey = `form2_gst_sub_${item.section}_${selectedSyId || 'default'}`;
              let subData = cacheService.get(subCacheKey);
              if (!subData) {
                const subRes = await fetch(getApiUrl(subUrl), {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                subData = await subRes.json();
                if (subRes.ok && subData.success) {
                  cacheService.set(subCacheKey, subData, 180000);
                }
              }

              if (subData && subData.success && subData.submission) {
                const sub = subData.submission;
                gradeGroups[item.gradeKey][item.section].above14 = sub.above_14_count || 0;
                gradeGroups[item.gradeKey][item.section].below14 = sub.below_14_count || 0;
              }
            })
          );
        } catch (e) {
          console.warn('Error fetching GST submissions for Form 2:', e);
        }

        // Build structured grade sections ensuring Grade IV, V, VI each have exactly 3 slots minimum
        const targetGrades = ['IV', 'V', 'VI'];
        const gradeBlocks = [];

        targetGrades.forEach((gKey) => {
          const secEntries = Object.entries(gradeGroups[gKey] || {}).sort((a, b) =>
            a[0].localeCompare(b[0], undefined, { sensitivity: 'base' })
          );
          const sectionRows = secEntries.map(([secName, secData]) => ({
            section: secName,
            enrolment: secData.enrolment,
            above14: secData.above14,
            below14: secData.below14,
            isEmpty: false,
          }));

          // Pad up to 3 slots minimum if fewer registered sections exist
          while (sectionRows.length < 3) {
            sectionRows.push({ section: '', enrolment: '', above14: '', below14: '', isEmpty: true });
          }

          // Calculate Grade summary totals
          const gradeEnrolment = sectionRows.reduce((sum, r) => sum + (Number(r.enrolment) || 0), 0);
          const gradeAbove14 = sectionRows.reduce((sum, r) => sum + (Number(r.above14) || 0), 0);
          const gradeBelow14 = sectionRows.reduce((sum, r) => sum + (Number(r.below14) || 0), 0);

          gradeBlocks.push({
            grade: gKey,
            total: { enrolment: gradeEnrolment, above14: gradeAbove14, below14: gradeBelow14 },
            sections: sectionRows,
          });
        });

        setRowsData(gradeBlocks);
      } catch (err) {
        console.warn('Failed to fetch Form 2 live data:', err);
        setRowsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchForm2Data();
  }, [selectedSyId]);

  // Dynamic calculation for overall school totals
  const calculatedTotals = useMemo(() => {
    let totalEnrolment = 0;
    let totalAbove14 = 0;
    let totalBelow14 = 0;

    rowsData.forEach((block) => {
      totalEnrolment += Number(block.total?.enrolment) || 0;
      totalAbove14 += Number(block.total?.above14) || 0;
      totalBelow14 += Number(block.total?.below14) || 0;
    });

    return { enrolment: totalEnrolment, above14: totalAbove14, below14: totalBelow14 };
  }, [rowsData]);

  // Export official DepEd styled .xlsx file using ExcelJS
  const handleExportXLSX = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Phil-IRI Form 2');

      // Set default column widths
      worksheet.columns = [
        { key: 'grade', width: 16 },
        { key: 'section', width: 32 },
        { key: 'enrolment', width: 22 },
        { key: 'above14', width: 22 },
        { key: 'below14', width: 22 },
      ];

      // 1. Header Information Block
      worksheet.addRow([]);
      const r2 = worksheet.addRow(['', '', '', '', 'PHIL-IRI FORM 2']);
      r2.getCell(5).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF555555' } };
      r2.getCell(5).alignment = { horizontal: 'right' };

      const r3 = worksheet.addRow(['TALAAN NG PAARALAN SA PAGBABASA (TPP) /']);
      worksheet.mergeCells('A3:E3');
      r3.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      r3.getCell(1).alignment = { horizontal: 'center' };

      const r4 = worksheet.addRow(['SCHOOL READING PROFILE (SRP)']);
      worksheet.mergeCells('A4:E4');
      r4.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      r4.getCell(1).alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      // 2. School Info Grid
      const info1 = worksheet.addRow([`School: ${dbSchoolInfo.school || ''}`, '', '', `Division: ${dbSchoolInfo.division || ''}`, '']);
      const info2 = worksheet.addRow([`District: ${dbSchoolInfo.district || ''}`, '', '', `Region: ${dbSchoolInfo.region || ''}`, '']);

      [info1, info2].forEach((row) => {
        row.font = { name: 'Arial', size: 10, bold: true };
      });

      worksheet.addRow([]);

      // 3. Table Headers
      const h1 = worksheet.addRow(['GRADE', 'SECTIONS', 'ENROLMENT', 'SCORE (MARKA)', '']);
      const h2 = worksheet.addRow(['', '', '', 'MARKANG >= 14', 'MARKANG <= 14']);

      worksheet.mergeCells('A9:A10');
      worksheet.mergeCells('B9:B10');
      worksheet.mergeCells('C9:C10');
      worksheet.mergeCells('D9:E9');

      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E2E2' } };
      const gradeHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };
      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF999999' } },
        left: { style: 'thin', color: { argb: 'FF999999' } },
        bottom: { style: 'thin', color: { argb: 'FF999999' } },
        right: { style: 'thin', color: { argb: 'FF999999' } },
      };

      [h1, h2].forEach((row) => {
        row.eachCell((cell) => {
          cell.fill = headerFill;
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = borderThin;
        });
      });
      h1.getCell(1).fill = gradeHeaderFill;
      h1.getCell(3).fill = gradeHeaderFill;

      // 4. Populate Table Data Rows with exact Styles
      const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE08B' } };
      const rowGrayBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };

      rowsData.forEach((block) => {
        // Yellow Grade Summary Row
        const sumRow = worksheet.addRow([block.grade, '', block.total.enrolment, block.total.above14, block.total.below14]);
        sumRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.fill = yellowFill;
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.border = borderThin;
          if (colNumber === 1) {
            cell.fill = gradeHeaderFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNumber >= 3) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });

        // Section rows under Grade
        block.sections.forEach((sec) => {
          const secRow = worksheet.addRow(['', sec.section, sec.enrolment, sec.above14, sec.below14]);
          secRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = borderThin;
            cell.font = { name: 'Arial', size: 10 };
            if (colNumber === 1) {
              cell.fill = gradeHeaderFill;
            } else if (colNumber === 2) {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
              cell.font = { name: 'Arial', size: 10, bold: true };
            } else if (colNumber === 3) {
              cell.fill = rowGrayBg;
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.font = { name: 'Arial', size: 10, bold: true };
            } else {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.font = { name: 'Arial', size: 10, bold: true };
            }
          });
        });
      });

      // 5. Grand Total Row (Green Bar)
      const totalRow = worksheet.addRow(['TOTAL (KABUUANG PAARALAN)', '', calculatedTotals.enrolment, calculatedTotals.above14, calculatedTotals.below14]);
      const lastRowIndex = worksheet.rowCount;
      worksheet.mergeCells(`A${lastRowIndex}:B${lastRowIndex}`);

      const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF107C41' } };
      totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = greenFill;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = borderThin;
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // 6. Footer Signatures Block
      worksheet.addRow([]);
      worksheet.addRow([]);
      const sigRow = worksheet.addRow(['Inihanda ni (Prepared):', '', '', 'Binigyang-pansin (Noted):', '']);
      sigRow.font = { name: 'Arial', size: 9, italic: true };

      const sigNames = worksheet.addRow(['___________________________', '', '', dbSchoolInfo.principalName || '___________________________', '']);
      sigNames.font = { name: 'Arial', size: 10, bold: true };

      const sigTitles = worksheet.addRow(['Phil-IRI Coordinator', '', '', 'Punong-guro (School Principal)', '']);
      sigTitles.font = { name: 'Arial', size: 9, bold: true };

      // Write to Buffer & Trigger Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phil-IRI_Form_2_School_Reading_Profile.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      triggerToast('Downloaded Styled DepEd Phil-IRI Form 2 (.XLSX)!');
    } catch (err) {
      console.error('Failed to export styled Excel file:', err);
      triggerToast('Failed to export Excel file.', 'error');
    }
  };

  if (loading) {
    return <PhilIriForm2Skeleton rows={6} />;
  }

  return (
    <div className="relative font-sans text-xs">
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Action Bar for Exporting & Filtering */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">
          PHIL-IRI FORM 2 — School Reading Profile (SRP) / Talaan ng Paaralan sa Pagbabasa (TPP)
        </h3>
        <div className="flex items-center gap-3">
          {/* School Year Selector Dropdown */}
          {schoolYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink/70">School Year:</span>
              <select
                value={selectedSyId}
                onChange={(e) => setSelectedSyId(e.target.value)}
                className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink focus:border-[#107c41] focus:outline-none shadow-2xs"
              >
                {schoolYears.map((sy) => {
                  const syId = sy.id || sy.school_year_id;
                  const label = sy.schoolYear || sy.school_year || sy.yearLabel || sy.label;
                  const isActive = sy.is_active || sy.isActive;
                  return (
                    <option key={syId} value={syId}>
                      SY {label} {isActive ? '(Active)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs"
          >
            <DownloadSimple size={16} weight="bold" className="text-[#107c41]" />
            <span>Export .XLSX</span>
          </button>
        </div>
      </div>

      {/* ── CLEAN OFFICIAL DEPED EXCEL FORM TABLE UI ── */}
      <div className="overflow-x-auto rounded-lg border border-ink/20 bg-white p-6 shadow-xs">
        <div className="min-w-[850px]">
          {/* Sheet Header Information */}
          <div className="text-center space-y-0.5 mb-4">
            <p className="text-right text-[11px] font-bold text-ink/70">PHIL-IRI FORM 2</p>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
              TALAAN NG PAARALAN SA PAGBABASA (TPP) /
            </h2>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">
              SCHOOL READING PROFILE (SRP)
            </h2>
          </div>

          {/* Form Header Information Grid */}
          <div className="text-xs text-ink font-semibold mb-6 space-y-2.5 px-1">
            <div className="grid grid-cols-2 gap-x-12">
              <div className="flex items-center">
                <span>School:</span>
                <strong className="grow border-b border-ink font-bold px-3 ml-2 text-ink">
                  {dbSchoolInfo.school || '\u00A0'}
                </strong>
              </div>
              <div className="flex items-center">
                <span>Division:</span>
                <strong className="grow border-b border-ink font-bold px-3 ml-2 text-ink">
                  {dbSchoolInfo.division || '\u00A0'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12">
              <div className="flex items-center">
                <span>District:</span>
                <strong className="grow border-b border-ink font-bold px-3 ml-2 text-ink">
                  {dbSchoolInfo.district || '\u00A0'}
                </strong>
              </div>
              <div className="flex items-center">
                <span>Region:</span>
                <strong className="grow border-b border-ink font-bold px-3 ml-2 text-ink">
                  {dbSchoolInfo.region || '\u00A0'}
                </strong>
              </div>
            </div>
          </div>

          {/* Clean Form Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs font-sans border border-gray-400">
              <thead>
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th rowSpan={2} className="w-[15%] border border-gray-400 p-2.5 bg-[#d4d4d4]">Grade</th>
                  <th rowSpan={2} className="w-[30%] border border-gray-400 p-2.5 text-left">Sections</th>
                  <th rowSpan={2} className="w-[20%] border border-gray-400 p-2.5 bg-[#d4d4d4]">Enrolment</th>
                  <th colSpan={2} className="border border-gray-400 p-2">Score (Marka)</th>
                </tr>
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th className="w-[17.5%] border border-gray-400 p-2 text-xs">Markang &ge; 14</th>
                  <th className="w-[17.5%] border border-gray-400 p-2 text-xs">Markang &le; 14</th>
                </tr>
              </thead>
              <tbody>
                {rowsData.map((block, bIdx) => {
                  return (
                    <React.Fragment key={bIdx}>
                      {/* Yellow Grade Total Row */}
                      <tr className="font-bold text-gray-900 bg-[#fef08a]">
                        <td className="border border-gray-400 p-2 font-bold text-gray-900 bg-[#d4d4d4] text-center">
                          {block.grade}
                        </td>
                        <td className="border border-gray-400 p-2 text-left font-semibold text-gray-900">
                          {'\u00A0'}
                        </td>
                        <td className="border border-gray-400 p-2 font-bold text-gray-900 text-right">
                          {block.total.enrolment}
                        </td>
                        <td className="border border-gray-400 p-2 font-bold text-black text-right">
                          {block.total.above14}
                        </td>
                        <td className="border border-gray-400 p-2 font-bold text-black text-right">
                          {block.total.below14}
                        </td>
                      </tr>

                      {/* Section Rows under Grade */}
                      {block.sections.map((secRow, sIdx) => (
                        <tr key={sIdx} className="hover:bg-[#f5faf6] transition-colors">
                          <td className="border border-gray-400 p-2 font-bold text-gray-900 bg-[#d4d4d4] text-center">
                            {'\u00A0'}
                          </td>
                          <td className="border border-gray-400 p-2 text-left font-semibold text-gray-900">
                            {secRow.section || '\u00A0'}
                          </td>
                          <td className="border border-gray-400 p-2 font-bold text-gray-900 text-center bg-[#eaeaea]">
                            {secRow.enrolment}
                          </td>
                          <td className="border border-gray-400 p-2 font-bold text-black text-center">
                            {secRow.above14}
                          </td>
                          <td className="border border-gray-400 p-2 font-bold text-black text-center">
                            {secRow.below14}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Grand Total Summary Row */}
                <tr className="bg-[#107c41] text-white font-extrabold text-xs">
                  <td colSpan={2} className="p-3 text-left uppercase tracking-wider">
                    TOTAL (KABUUANG PAARALAN)
                  </td>
                  <td className="p-3 text-center font-mono text-sm">{calculatedTotals.enrolment}</td>
                  <td className="p-3 text-center font-mono text-sm text-white">{calculatedTotals.above14}</td>
                  <td className="p-3 text-center font-mono text-sm text-white">{calculatedTotals.below14}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Note & Signatures Section */}
          <div className="mt-10 pt-4 flex justify-between items-end text-xs px-8 max-w-4xl mx-auto">
            {/* Left Side: Prepared by / Phil-IRI Coordinator */}
            <div className="flex items-end gap-3">
              <span className="text-ink/70 font-normal pb-5">Inihanda ni (Prepared):</span>
              <div className="flex flex-col items-center">
                <div className="w-56 border-b border-ink font-bold text-center pb-0.5 text-ink">
                  {'\u00A0'}
                </div>
                <p className="mt-1 text-[11px] font-bold text-ink/80">Phil-IRI Coordinator</p>
              </div>
            </div>

            {/* Right Side: Noted by / School Principal */}
            <div className="flex items-end gap-3">
              <span className="text-ink/70 font-normal pb-5">Binigyang-pansin (Noted):</span>
              <div className="flex flex-col items-center">
                <div className="w-56 border-b border-ink font-bold text-center pb-0.5 text-ink">
                  {dbSchoolInfo.principalName || '\u00A0'}
                </div>
                <p className="mt-1 text-[11px] font-bold text-ink/80">Punong-guro (School Principal)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

