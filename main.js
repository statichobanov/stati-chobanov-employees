if (typeof process !== 'undefined') {
    var fs = require('fs');

    // Arguments read by process.argv at index 0 and 1 are typically the 
    // node.js executable path and the JS filepath respectively
    // hence why we start from index 2
    for (let i = 2; i < process.argv.length; i++) {
        try {
            var data = fs.readFileSync(process.argv[i], 'utf8');
            const result = proccessFileTextContent(data, process.argv[i].split('.').pop());  
            console.log('Result for: ', process.argv[i]);
            console.log('Message: ', result.message);
            console.log(`Employee One ID# ${result.data.firstEmployeeId}`);
            console.log(`Employee Two ID# ${result.data.secondEmployeeId}`);
            console.log(`Project ID# ${result.data.projectId}`);
            console.log(`Days worked# ${result.data.days}`);
            console.log('--------------------------');   
        } catch(e) {
            console.error('Error:', e.stack);
        }
    }

} else { 
    window.onload = function() {
        const fileInput = document.getElementById('file-input');
        const displayArea = document.getElementById('display-area');
        const dataTable = document.getElementById('data-table');

        fileInput.addEventListener('change', function(e) {
            const file = fileInput.files[0];
            
            if (file) {
                const reader = new FileReader();
                
                reader.readAsText(file);
                
                reader.onload = function(e) {
                    const text = reader.result;
                    const result = proccessFileTextContent(text, file.name.split('.').pop());
                    const rowData = document.getElementById('row-data');
                        
                    displayArea.innerText = result.message;

                    if (result.data) {
                        if(rowData) {
                            rowData.innerHTML = ''
                        }
                        dataTable.classList.remove('hidden');
                        const resultRow = document.createElement('tr')
                        resultRow.id = 'row-data';
                        resultRow.innerHTML = `<td>${result.data.firstEmployeeId}</td><td>${result.data.secondEmployeeId}</td><td>${result.data.projectId}</td><td>${result.data.days}</td>`;
                        dataTable.appendChild(resultRow);
                    } else {
                        dataTable.classList.add('hidden');
                    }
                    
                };
    
            } else {
                displayArea.innerText = "File not supported!";
            }
        });
    };
}

/**
 * @description proccessing file content
 * @param {String} text text content from the File
 * @param {String} fileExtension extension of the file (currently supported .txt and .csv)
 * @returns {String}
 */
function proccessFileTextContent(text, fileExtension) {
    if (fileExtension === 'txt' || fileExtension === 'csv') {
        const employeesData = text.split(/\r?\n/).filter(row => row.length);

        // remove first headers row if file type is .csv
        if(fileExtension === 'csv') {
            employeesData.shift();
        }
    
        const employees = generateEmployees(employeesData);

        if (employees) {
            const result = calculateLongestPeriod(employees);
            return {
                data: result,
                message: 'File Loaded',
            };
        } else {
            return {
                data: null,
                message: 'Invalid or empty file!',
            };
        }
    } else {
        return {
            data: null,
            message: 'File not supported! Only .txt and .csv files supported!',
        };
    }
}


/**
 * @description Generates employee object
 * @param {Array<String>} employeesData 
 * @returns {Array<Object>} Array with employees objects
 */
function generateEmployees(employeesData) {
    let employeesAreValid = true;
    
    const result = employeesData.map((dataRow, index) => {
        const employeeData = dataRow.split(',');
        const dateFrom = employeeData[2].trim() === 'NULL' ? new Date() : new Date(employeeData[2].trim());
        const dateTo = employeeData[3].trim() === 'NULL' ? new Date() : new Date(employeeData[3].trim());

        if (isValidDate(dateFrom) && isValidDate(dateTo)) {
            return {
                employeeId: employeeData[0].trim(),
                projectId: employeeData[1].trim(),
                dateFrom,
                dateTo
            };
        } else {
            employeesAreValid = false;
            console.error(`Row number ${index + 1} contains an invalid date`);
        }
    });

    return employeesAreValid ? result : null;
}

/**
 * @description Calculates which two employees have worked longest time in same project
 * @param {String<Object>} employees
 * @returns {Object} Data object containing employees id's, project id, and days worked on project
 */
function calculateLongestPeriod(employees) {
    const result = {};
    let timeWorked = 0;

    for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        
        for (let j = i + 1; j < employees.length; j++) {
            const employeeColleague = employees[j];

            if(workedTogheter(employee, employeeColleague)) {
                //date both employees started work on the project
                const startDate = (employee.dateFrom > employeeColleague.dateFrom) ? employee.dateFrom : employeeColleague.dateFrom;

                //date both employees end work on the project
                const endDate = (employee.dateTo > employeeColleague.dateTo) ? employeeColleague.dateTo : employee.dateTo;

                //days both spend on the project
                const currentTimeWorked = daysBetween(startDate, endDate);

                if(timeWorked < currentTimeWorked) {
                    timeWorked = currentTimeWorked;

                    result.days = timeWorked;
                    result.firstEmployeeId = employee.employeeId;
                    result.secondEmployeeId = employeeColleague.employeeId;
                    result.projectId = employee.projectId;
                }
            }
        }
    }

    return result;
}

/**
 * @description check if given employees have worked togheter in same project at the same period of time;
 * @param {Object} firstEmployee 
 * @param {Object} secondEmployee
 * @returns boolean
 */
function workedTogheter(firstEmployee, secondEmployee) {
    if(firstEmployee.dateTo >= secondEmployee.dateFrom && firstEmployee.projectId === secondEmployee.projectId) {
        if(firstEmployee.dateFrom <= secondEmployee.dateTo) {
            return true;
        }
    }

    return false;
}

/**
 * @description Checks if arguments is a valid date object
 * @param {Object} obj 
 * @returns {Boolean} boolean stating if the object is a valid date
 */
function isValidDate(obj) {
    return obj instanceof Date && isFinite(obj);
}

/**
 * Calculate difference between given dates in days
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Number} Days
 */
function daysBetween(startDate, endDate) {
    //Get 1 day in milliseconds
    const oneDay = 1000*60*60*24;
    const startDateMilliSeconds = startDate.getTime();
    const endDateMilliSeconds = endDate.getTime();
  
    // Calculate the difference in milliseconds
    const difference = endDateMilliSeconds - startDateMilliSeconds;
      
    // Convert to days
    return Math.round(difference / oneDay); 
}