class Schedule {
    get workingHours() {
        if(Object.keys(this._workingHours).length) {
            return `The working hours are from ${this._formatWorkingHoursOutput(this._workingHours.start)} to ${this._formatWorkingHoursOutput(this._workingHours.stop)}`;
            //test: return this._workingHours;
        } else return `No working hours were set yet. Please set working hours using "workingHours" property`
    };
    set workingHours(workingHours){
        try{
            if(this._hoursCheck(workingHours)){
                this._workingHours = this._hoursNormalize(workingHours);
                console.log("Working hours were successfully set.")
            } else {
                throw new Error('An error has occurred while trying to set working hours. Please, make sure you pass an object of the format {start: "00:00", stop: "00:00"}')
            }
        }catch(err) {
            console.error(err.message);
        }
    };
    get busyPeriods() {
        if(this._busyPeriods.length) {
            return this._busyPeriods;
        } else return `No busy periods were set yet. Please set busy periods using "busyPeriods" property`

    };
    set busyPeriods(periods){
        try{
            const lenBefore = this._busyPeriods.length;
            const checkedPeriods = this._getCheckedBusyPeriods(periods);
            if(checkedPeriods.passed.length > 0) {
                this._busyPeriods = checkedPeriods.passed.map((period)=> {
                    return this._hoursNormalize(period)
                })

            } else {
                throw new Error('An error occurred while trying to set busy periods. No busy period qualified creteria. Please, make sure you pass an array of objects of the format {start: "00:00", stop: "00:00"} +- 5mins.')
            }
            const lenAfter = this._busyPeriods.length;
            console.warn(`${lenAfter - lenBefore} ${lenAfter - lenBefore !== 1 ? 'periods were':'period was'} successfully set. ${checkedPeriods.failed.length > 0 ? checkedPeriods.failed.length + ' did not qualify.' : ''}`);
            checkedPeriods.failed.length > 0 && console.table(checkedPeriods.failed);
        } catch(err){
            console.error(err.message);
        }
    }
    constructor(workingHours={}, busyPeriods=[]) {
        this._id = Date.now();
        if(this._hoursCheck(workingHours) && Array.isArray(busyPeriods)){
            this._workingHours = this._hoursNormalize(workingHours);
            this._busyPeriods = busyPeriods;
        } else {
            this._workingHours = {};
            this._busyPeriods = [];
        }
    }
    _hoursCheck(hours) {
        if(Object.prototype.toString.call(hours) === '[object Object]'
           && Object.keys(hours).length === 2
           && Object.keys(hours).includes('start')
           && Object.keys(hours).includes('stop')
           && Object.values(hours).every((value)=> typeof value === 'string')
           && Object.values(hours).every((value)=> value.search(/^([0-1]?[0-9]|2[0-3]):[0-5][05]?$/) !== -1)) {
            return true;
        } else return false;
    };
    _hoursNormalize(hours) {
        return Object.entries(hours).reduce((result, entry)=>{
            const value = entry[1].split(':');
            return {
                ...result,
                [entry[0]]: value.map((part)=> part.padStart(2,0))
            }
        }, {})
    };
    _getCheckedBusyPeriods(periods) {
        if(!Array.isArray(periods) || periods.length <= 0) {
            throw new Error('Invalid busy periods. Please, make sure you pass a non-empty array of objects of the format {start: "00:00", stop: "00:00} +- 5mins.')
        }
        const result = {passed:[], failed:[]};
        periods.forEach((period, index)=>{
            if(this._hoursCheck(period)) {
                result.passed.push(period);
            } else {
                result.failed.push(Object.assign(period, {position: index}));
            }
        });
        return result
    }
    _formatWorkingHoursOutput(time) {
        return time.join(':');
    }
} 

const schedule = new Schedule();
schedule.busyPeriods = [
    {'start' : '10:30',
    'stop' : '10:50'
    },
    {'start' : '18:40',
    'stop' : '18:50'
    },
    {'start' : '20:40',
    'stop' : '15:50'
    },
    {'start' : '16:20',
    'stop' : '17:20'
    },
    {'start' : '20:05',
    'stop' : '20:20'
    }
];

schedule.workingHours = {start: '10:30', stop: '18:00'};