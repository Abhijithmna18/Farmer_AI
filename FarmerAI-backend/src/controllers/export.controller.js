const GrowthCalendar = require('../models/GrowthCalendar');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-writer');
const PDFDocument = require('pdfkit');

// Export calendar to CSV
exports.exportToCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Calendar not found'
      });
    }

    // Create CSV data
    const csvData = [];
    
    // Add calendar info
    csvData.push({
      'Type': 'Calendar Info',
      'Field': 'Crop Name',
      'Value': calendar.cropName,
      'Date': '',
      'Description': ''
    });
    
    csvData.push({
      'Type': 'Calendar Info',
      'Field': 'Variety',
      'Value': calendar.variety || '',
      'Date': '',
      'Description': ''
    });
    
    csvData.push({
      'Type': 'Calendar Info',
      'Field': 'Planting Date',
      'Value': calendar.plantingDate ? new Date(calendar.plantingDate).toLocaleDateString() : '',
      'Date': '',
      'Description': ''
    });
    
    csvData.push({
      'Type': 'Calendar Info',
      'Field': 'Estimated Harvest Date',
      'Value': calendar.estimatedHarvestDate ? new Date(calendar.estimatedHarvestDate).toLocaleDateString() : '',
      'Date': '',
      'Description': ''
    });

    // Add crop events
    calendar.cropEvents.forEach(event => {
      csvData.push({
        'Type': 'Crop Event',
        'Field': event.type,
        'Value': event.title,
        'Date': new Date(event.date).toLocaleDateString(),
        'Description': event.description || ''
      });
    });

    // Add growth stages
    calendar.stages.forEach(stage => {
      csvData.push({
        'Type': 'Growth Stage',
        'Field': stage.stageName,
        'Value': stage.description || '',
        'Date': `${new Date(stage.startDate).toLocaleDateString()} - ${new Date(stage.endDate).toLocaleDateString()}`,
        'Description': stage.careNeeds || ''
      });
    });

    // Convert to CSV string
    const csvString = [
      'Type,Field,Value,Date,Description',
      ...csvData.map(row => 
        `"${row.Type}","${row.Field}","${row.Value}","${row.Date}","${row.Description}"`
      )
    ].join('\n');

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${calendar.cropName}-calendar.csv"`);
    
    res.send(csvString);

    // Log export
    calendar.exportHistory.push({
      format: 'csv',
      exportedAt: new Date(),
      exportedBy: userId,
      fileSize: Buffer.byteLength(csvString, 'utf8')
    });
    await calendar.save();

    logger.info(`Calendar ${id} exported to CSV by user ${userId}`);
  } catch (error) {
    logger.error('Error exporting calendar to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export calendar',
      error: error.message
    });
  }
};

// Export calendar to PDF
exports.exportToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Calendar not found'
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${calendar.cropName}-calendar.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content
    doc.fontSize(20).text(`${calendar.cropName} Growth Calendar`, 50, 50);
    
    if (calendar.variety) {
      doc.fontSize(14).text(`Variety: ${calendar.variety}`, 50, 80);
    }
    
    doc.fontSize(12).text(`Planting Date: ${new Date(calendar.plantingDate).toLocaleDateString()}`, 50, 110);
    
    if (calendar.estimatedHarvestDate) {
      doc.text(`Estimated Harvest: ${new Date(calendar.estimatedHarvestDate).toLocaleDateString()}`, 50, 130);
    }

    // Add crop events
    let yPosition = 170;
    doc.fontSize(16).text('Crop Events', 50, yPosition);
    yPosition += 30;

    calendar.cropEvents.forEach(event => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(12).text(`${event.type.toUpperCase()}: ${event.title}`, 70, yPosition);
      doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 70, yPosition + 20);
      
      if (event.description) {
        doc.text(`Description: ${event.description}`, 70, yPosition + 40);
        yPosition += 60;
      } else {
        yPosition += 40;
      }
    });

    // Add growth stages
    yPosition += 20;
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.fontSize(16).text('Growth Stages', 50, yPosition);
    yPosition += 30;

    calendar.stages.forEach(stage => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(12).text(`${stage.stageName}`, 70, yPosition);
      doc.text(`Period: ${new Date(stage.startDate).toLocaleDateString()} - ${new Date(stage.endDate).toLocaleDateString()}`, 70, yPosition + 20);
      
      if (stage.description) {
        doc.text(`Description: ${stage.description}`, 70, yPosition + 40);
        yPosition += 60;
      } else {
        yPosition += 40;
      }
    });

    // Finalize PDF
    doc.end();

    // Log export
    calendar.exportHistory.push({
      format: 'pdf',
      exportedAt: new Date(),
      exportedBy: userId,
      fileSize: 0 // Will be calculated after generation
    });
    await calendar.save();

    logger.info(`Calendar ${id} exported to PDF by user ${userId}`);
  } catch (error) {
    logger.error('Error exporting calendar to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export calendar',
      error: error.message
    });
  }
};

// Export calendar to JSON
exports.exportToJSON = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Calendar not found'
      });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${calendar.cropName}-calendar.json"`);
    
    res.json({
      calendar: {
        cropName: calendar.cropName,
        variety: calendar.variety,
        plantingDate: calendar.plantingDate,
        estimatedHarvestDate: calendar.estimatedHarvestDate,
        regionalClimate: calendar.regionalClimate,
        cropEvents: calendar.cropEvents,
        stages: calendar.stages,
        harvestRecords: calendar.harvestRecords,
        customReminders: calendar.customReminders,
        location: calendar.location,
        season: calendar.season,
        year: calendar.year
      },
      exportedAt: new Date(),
      exportedBy: userId
    });

    // Log export
    calendar.exportHistory.push({
      format: 'json',
      exportedAt: new Date(),
      exportedBy: userId,
      fileSize: 0 // Will be calculated after generation
    });
    await calendar.save();

    logger.info(`Calendar ${id} exported to JSON by user ${userId}`);
  } catch (error) {
    logger.error('Error exporting calendar to JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export calendar',
      error: error.message
    });
  }
};

// Import calendar from file
exports.importCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { format } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileContent = req.file.buffer.toString('utf8');
    let calendarData;

    // Parse based on format
    switch (format) {
      case 'json':
        calendarData = JSON.parse(fileContent);
        break;
      case 'csv':
        // Simple CSV parsing (you might want to use a proper CSV parser)
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        calendarData = { cropEvents: [] };
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            
            if (row.Type === 'Crop Event') {
              calendarData.cropEvents.push({
                type: row.Field,
                title: row.Value,
                date: new Date(row.Date),
                description: row.Description
              });
            } else if (row.Type === 'Calendar Info') {
              calendarData[row.Field.toLowerCase().replace(' ', '')] = row.Value;
            }
          }
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format'
        });
    }

    // Create new calendar
    const newCalendar = new GrowthCalendar({
      ...calendarData,
      user: userId,
      year: new Date().getFullYear(),
      season: `${new Date().getFullYear()}-${getSeason(new Date())}`
    });

    await newCalendar.save();

    logger.info(`Calendar imported by user ${userId}: ${newCalendar._id}`);

    res.json({
      success: true,
      message: 'Calendar imported successfully',
      data: newCalendar
    });
  } catch (error) {
    logger.error('Error importing calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import calendar',
      error: error.message
    });
  }
};

// Helper function
function getSeason(date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}


