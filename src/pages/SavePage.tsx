import React from 'react';
import { ArrowLeft, HelpCircle, Download } from 'lucide-react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  HeadingLevel, 
  TextRun, 
  AlignmentType, 
  convertInchesToTwip, 
  Header, 
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface SavePageProps {
  onBack: () => void;
  onStartNew: () => void;
  sections: { title: string; answer: string }[];
  flowName: string;
}

export function SavePage({ onBack, onStartNew, sections, flowName }: SavePageProps) {
  const [hasReviewed, setHasReviewed] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const cmToTwips = (cm: number) => {
    return Math.round(cm * 566.9291338582677);
  };

  const parseMarkdownText = (text: string): TextRun[] => {
    const textRuns: TextRun[] = [];
    let currentText = '';
    let isBold = false;
    let isItalic = false;
    let i = 0;

    while (i < text.length) {
      if (text[i] === '*' || text[i] === '_') {
        if (i + 1 < text.length && (text[i + 1] === '*' || text[i + 1] === '_')) {
          if (currentText) {
            textRuns.push(new TextRun({
              text: currentText,
              bold: isBold,
              italics: isItalic,
              size: 24
            }));
            currentText = '';
          }
          isBold = !isBold;
          i += 2;
          continue;
        }
        else {
          if (currentText) {
            textRuns.push(new TextRun({
              text: currentText,
              bold: isBold,
              italics: isItalic,
              size: 24
            }));
            currentText = '';
          }
          isItalic = !isItalic;
          i++;
          continue;
        }
      }
      currentText += text[i];
      i++;
    }

    if (currentText) {
      textRuns.push(new TextRun({
        text: currentText,
        bold: isBold,
        italics: isItalic,
        size: 24
      }));
    }

    return textRuns;
  };

  const parseTable = (tableLines: string[]): Table => {
    const headerRow = tableLines[0].trim();
    const alignmentRow = tableLines[1].trim();
    const dataRows = tableLines.slice(2);

    const alignments = alignmentRow.split('|')
      .filter(cell => cell.trim())
      .map(cell => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return AlignmentType.CENTER;
        if (trimmed.endsWith(':')) return AlignmentType.RIGHT;
        return AlignmentType.LEFT;
      });

    const headers = headerRow.split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim());

    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      },
      rows: [
        new TableRow({
          children: headers.map((header, index) => 
            new TableCell({
              children: [new Paragraph({
                children: parseMarkdownText(header),
                alignment: alignments[index],
              })],
              shading: {
                fill: "F2F2F2",
                val: "clear",
                color: "auto",
              },
            })
          ),
        }),
        ...dataRows.map(row => 
          new TableRow({
            children: row
              .split('|')
              .filter(cell => cell.trim())
              .map((cell, index) => 
                new TableCell({
                  children: [new Paragraph({
                    children: parseMarkdownText(cell.trim()),
                    alignment: alignments[index],
                  })]
                })
              )
          })
        )
      ]
    });

    return table;
  };

  const generateWordDocument = async () => {
    setIsDownloading(true);

    try {
      const logoPath = '/src/assets/SVLWordLogo.png';
      const response = await fetch(logoPath);
      const logoBlob = await response.blob();
      const logoArrayBuffer = await logoBlob.arrayBuffer();

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Times New Roman',
                size: 24,
                color: '000000'
              },
              paragraph: {
                spacing: { line: 276, before: 0, after: 0 },
                alignment: AlignmentType.LEFT
              }
            },
            heading1: {
              run: {
                font: 'Arial',
                size: 40,
                bold: true,
                color: '000000'
              },
              paragraph: {
                spacing: { before: 400, after: 200, line: 276 },
                alignment: AlignmentType.LEFT
              }
            },
            heading2: {
              run: {
                font: 'Arial',
                size: 32,
                bold: true,
                color: '000000'
              },
              paragraph: {
                spacing: { before: 300, after: 200, line: 276 },
                alignment: AlignmentType.LEFT
              },
            },
            heading3: {
              run: {
                font: 'Arial',
                size: 28,
                bold: true,
                color: '000000'
              },
              paragraph: {
                spacing: { before: 300, after: 200, line: 276 },
                alignment: AlignmentType.LEFT
              }
            }
          }
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: cmToTwips(2.77),
                bottom: cmToTwips(2.49),
                left: cmToTwips(3.7),
                right: cmToTwips(5.5)
              }
            }
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoArrayBuffer,
                      transformation: {
                        width: 228,
                        height: 91
                      }
                    })
                  ],
                  alignment: AlignmentType.LEFT,
                  indent: { left: cmToTwips(-3.25) }
                })
              ]
            })
          },
          children: sections.flatMap(section => {
            const paragraphs: (Paragraph | Table)[] = [];

            paragraphs.push(
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200, line: 276 },
                alignment: AlignmentType.LEFT
              })
            );

            const lines = section.answer.split('\n');
            let inList = false;
            let listItems: string[] = [];
            let listLevel = 0;
            let inTable = false;
            let tableLines: string[] = [];

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmedLine = line.trim();

              if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
                if (!inTable) {
                  inTable = true;
                  tableLines = [trimmedLine];
                  continue;
                } else {
                  tableLines.push(trimmedLine);
                  continue;
                }
              }
              else if (inTable) {
                inTable = false;
                if (tableLines.length >= 2) {
                  paragraphs.push(parseTable(tableLines));
                }
                tableLines = [];
                if (trimmedLine === '') continue;
              }

              if (trimmedLine === '') {
                if (inList) {
                  listItems.forEach((item, index) => {
                    paragraphs.push(
                      new Paragraph({
                        children: parseMarkdownText(item),
                        bullet: {
                          level: listLevel
                        },
                        spacing: { after: index === listItems.length - 1 ? 200 : 100, line: 276 },
                        alignment: AlignmentType.LEFT
                      })
                    );
                  });
                  listItems = [];
                  inList = false;
                }
                continue;
              }

              if (trimmedLine.startsWith('#')) {
                const level = trimmedLine.match(/^#+/)?.[0].length || 1;
                const text = trimmedLine.replace(/^#+\s+/, '');
                paragraphs.push(
                  new Paragraph({
                    children: parseMarkdownText(text),
                    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                    spacing: { before: level === 1 ? 400 : 300, after: 200, line: 276 },
                    alignment: AlignmentType.LEFT
                  })
                );
                continue;
              }

              if (trimmedLine.match(/^[-*]\s/)) {
                inList = true;
                listItems.push(trimmedLine.replace(/^[-*]\s/, ''));
                continue;
              }

              const numberedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
              if (numberedListMatch) {
                paragraphs.push(
                  new Paragraph({
                    children: parseMarkdownText(numberedListMatch[1]),
                    numbering: {
                      reference: 'default-numbering',
                      level: 0
                    },
                    spacing: { after: 200, line: 276 },
                    alignment: AlignmentType.LEFT
                  })
                );
                continue;
              }

              if (trimmedLine.startsWith('>')) {
                paragraphs.push(
                  new Paragraph({
                    children: parseMarkdownText(trimmedLine.substring(1).trim()),
                    indent: { left: convertInchesToTwip(0.5) },
                    spacing: { before: 200, after: 200, line: 276 },
                    alignment: AlignmentType.LEFT
                  })
                );
                continue;
              }

              if (!inList && !inTable) {
                paragraphs.push(
                  new Paragraph({
                    children: parseMarkdownText(trimmedLine),
                    spacing: { after: 200, line: 276 },
                    alignment: AlignmentType.LEFT
                  })
                );
              }
            }

            if (inTable && tableLines.length >= 2) {
              paragraphs.push(parseTable(tableLines));
            }

            if (listItems.length > 0) {
              listItems.forEach((item, index) => {
                paragraphs.push(
                  new Paragraph({
                    children: parseMarkdownText(item),
                    bullet: {
                      level: listLevel
                    },
                    spacing: { after: index === listItems.length - 1 ? 200 : 100, line: 276 },
                    alignment: AlignmentType.LEFT
                  })
                );
              });
            }

            return paragraphs;
          })
        }]
      });

      const blob = await Packer.toBlob(doc);
      const date = new Date().toISOString().split('T')[0];
      saveAs(blob, `${flowName} ${date}.docx`);
    } catch (error) {
      console.error('Failed to generate document:', error);
      alert('Ett fel uppstod när dokumentet skulle genereras. Försök igen.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-[#1D1D1B]">
          Spara dokument för {flowName.toLowerCase()}
        </h1>
        <button className="text-[#006EC2] hover:text-[#005DA3]">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-lg p-8">
        <p className="text-[#1D1D1B] mb-6">
          Ditt dokument sparas på din dator. Eftersom stora delar av innehållet är automatiskt sammanställt med AI är du{' '}
          <span className="font-medium">skyldig att granska dokumentet manuellt</span>. Om inte nedladdningen startar automatiskt kan du trycka på 
          knappen för att ladda ner dokumentet. Har du problem med att spara dokument?{' '}
          <a href="#" className="text-[#006EC2] hover:underline">Läs mer om lorem ipsum här</a>.
        </p>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Förhandsgranskning</h2>
          <div className="space-y-6 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {sections.map((section, index) => (
              <div key={index} className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <div className="markdown-preview">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4 text-[#1D1D1B] leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                      li: ({ node, ...props }) => <li className="text-[#1D1D1B]" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-[#E5E5E5] pl-4 italic mb-4" {...props} />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-[#F5F5F5] px-1 rounded" {...props} />
                        ) : (
                          <code className="block bg-[#F5F5F5] p-4 rounded mb-4" {...props} />
                        ),
                    }}
                  >
                    {section.answer}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-start space-x-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={hasReviewed}
            onChange={(e) => setHasReviewed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-[#E5E5E5] text-[#006EC2] focus:ring-[#006EC2]"
          />
          <span className="text-[#1D1D1B]">
            Jag intygar att jag granskar och godkänner dokumentet manuellt innan det används
          </span>
        </label>

        <button
          onClick={generateWordDocument}
          disabled={isDownloading || !hasReviewed}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-[#006EC2] text-white rounded-lg hover:bg-[#005DA3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className={`w-5 h-5 ${isDownloading ? 'animate-spin' : ''}`} />
          <span>
            {isDownloading ? 'Genererar dokument...' : `Ladda ner ${flowName.toLowerCase()}`}
          </span>
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-[#1D1D1B] hover:text-[#006EC2] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Gå tillbaka
        </button>
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-[#E5E5E5] text-[#1D1D1B] rounded-lg hover:bg-[#D9D9D9] transition-colors"
        >
          Sammanställ en till skrivelse
        </button>
      </div>
    </div>
  );
}