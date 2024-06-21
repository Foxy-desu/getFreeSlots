class Schedule {
    get test() {
        console.log(this._formatFreeSlots(this._getFreeSlots(this._targetBusySlots(this._splitWorkingHoursToFiveMinSlots(this._workingHours)))));
    }
    get workingHours() {
        if(Object.keys(this._workingHours).length) {
            return (
                {
                    start: this._formatHoursOutput(this._workingHours.start),
                    stop: this._formatHoursOutput(this._workingHours.stop),
                }
            )

        } else {
            console.warn(`No working hours were set yet. Please set working hours using "workingHours" property`);
            return null;
        } 
    };
    set workingHours(workingHours){
        try{
            if(this._hoursCheck(workingHours)){
                this._workingHours = this._hoursNormalize(workingHours);
                this._hasUncomputedChanges = true;
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
            return this._busyPeriods.map((period)=> {
                return ({
                    start: this._formatHoursOutput(period.start),
                    stop: this._formatHoursOutput(period.stop),
                })
            })
        } else {
            console.warn(`No busy periods were set yet. Please set busy periods using "busyPeriods" property`);
            return null;
        }

    };
    set busyPeriods(periods){
        try{
            const checkedPeriods = this._getCheckedBusyPeriods(periods);
            if(checkedPeriods.passed.length > 0) {
                this._busyPeriods = checkedPeriods.passed.map((period)=> {
                    return this._hoursNormalize(period)
                });
                this._hasUncomputedChanges = true;

            } else {
                throw new Error('An error occurred while trying to set busy periods. No busy period qualified creteria. Please, make sure you pass an array of objects of the format {start: "00:00", stop: "00:00"} +- 5mins.')
            }
            console.warn(`${this._busyPeriods.length} ${this._busyPeriods.length ? 'periods were':'period was'} successfully set. ${checkedPeriods.failed.length > 0 ? checkedPeriods.failed.length + ' did not qualify.' : ''}`);
            checkedPeriods.failed.length > 0 && console.table(checkedPeriods.failed);
        } catch(err){
            console.error(err.message);
        }
    };
    get freePeriods() {
        if(Object.keys(this._workingHours).length === 0) {
            throw new Error('Cannot get freePeriods: necessary data is missing. Please, make sure you have set working hours.')
        }
       if(this._hasUncomputedChanges) {
            const freePeriods = this._computeFreePeriods();
            this._setFreePeriods(freePeriods);
           this._hasUncomputedChanges = false;
           console.log('recalculation...')
       } 
       return this._freePeriods;
    };
    constructor(workingHours={}, busyPeriods=[]) {
        this._id = Date.now();
        if(this._hoursCheck(workingHours) && Array.isArray(busyPeriods)){
            this._workingHours = this._hoursNormalize(workingHours);
            this._busyPeriods = busyPeriods;
        } else {
            this._workingHours = {};
            this._busyPeriods = [];
        }
    };
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
    };
    _formatHoursOutput(time) {
        return time.join(':');
    };
    _splitWorkingHoursToFiveMinSlots(workingHours) {
        const fiveMinuteSlots = [];
        const pushSlot = (hour, minute) => {
            fiveMinuteSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
        const startHours = Number(workingHours.start[0]),
              startMinutes = Number(workingHours.start[1]);
        const stopHours = Number(workingHours.stop[0]),
              stopMinutes = Number(workingHours.stop[1]);
        //work day hours
        if(startHours <= stopHours) {
            for(let i = startHours; i <= stopHours; i+=1) {
                if((i === startHours && startMinutes !== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(i, j);
                    }
                } else if(i === stopHours) {
                    for(let j = 0; j <= stopMinutes; j+=5) {
                        pushSlot(i, j);
                    }
                } else {
                    for(let j = 0; j <= 55; j+=5) {
                        pushSlot(i, j);
                    }
                    
                }
    
            }
        } else {
            //work night hours
            const hoursArray = [];
            for(let i = startHours; i <= 23; i+=1) {
                hoursArray.push(i);
            }
            for(let i = 0; i <= stopHours; i+=1) {
                hoursArray.push(i);
            }

            hoursArray.forEach((hour)=> {
                if((hour === startHours && startMinutes!== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(hour, j);
                    }
                } else if(hour === stopHours) {
                    for(let j = 0; j <= stopMinutes; j+=5) {
                        pushSlot(hour, j);
                    }
                } else {
                    for(let j = 0; j <= 55; j+=5) {
                        pushSlot(hour, j);
                    }
                    
                }
            })
        }
        return fiveMinuteSlots
    };
    _targetBusySlots(fiveMinuteSlots){
        const slotsWithTargets = fiveMinuteSlots.map((slot)=> {
            let isBusy = false;

            this._busyPeriods.forEach((busyPeriod) => {
                if (slot >= this._formatHoursOutput(busyPeriod.start) && slot < this._formatHoursOutput(busyPeriod.stop)) {
                    isBusy = true;
                }
            });
            if (!isBusy) {
                return slot;
            }
        });
        return slotsWithTargets;
    };
    _getFreeSlots(slotsWithTargets){
        // we need 30minute slots
        const thirtyMinuteSlots = [];
        let slot = [];
        let slotStartIndex = 0;
        let slotEndIndex = 6;

        slotsWithTargets.forEach((currSlot, index)=>{
            if(!currSlot) {
                slotStartIndex = index + 1;
                slotEndIndex = slotStartIndex + 6;
                slot = [];
            }
            if (index === slotEndIndex && currSlot) {
                slot.push(currSlot);
                slot.length === 7 && thirtyMinuteSlots.push(slot);
                slotStartIndex = slotEndIndex;
                slotEndIndex = slotStartIndex + 6;
                slot = [];
            }
            if (index < slotEndIndex && currSlot) {
                slot.push(currSlot);
            }
        });
        return thirtyMinuteSlots;   
    };
    _computeFreePeriods(){
        const fiveMinuteSlots = this._splitWorkingHoursToFiveMinSlots(this._workingHours);
        const slotsWithTargets = this._targetBusySlots(fiveMinuteSlots);
        const freeSlots = this._getFreeSlots(slotsWithTargets);
        return this._formatFreePeriods(freeSlots); 
    }
    _formatFreePeriods(freeSlots) {
        return freeSlots.reduce((result, slotArr)=> {
            return [
                ...result,
                {start: slotArr[0], stop: slotArr[slotArr.length -1]}
            ]
        },[]);
    };
    _setFreePeriods(freePeriods) {
        this._freePeriods = freePeriods;
    };
    _freePeriods = [];
    _hasUncomputedChanges = false;

} 

const schedule = new Schedule();
schedule.workingHours = {start: "00:00", stop: "03:30"};
console.log(schedule.freePeriods);
console.log(schedule.freePeriods);
console.log(schedule.freePeriods);
schedule.busyPeriods = [{start: "00:00", stop: "01:20"}, {start: "01:25", stop: "02:30"}];
console.log(schedule.freePeriods);
console.log(schedule.freePeriods);
schedule.workingHours = {start: "09:00", stop: "18:00"};
schedule.busyPeriods = [{start: "09:30", stop: "10:00"}, {start: "11:25", stop: "12:30"}];
console.log(schedule.freePeriods);
console.log(schedule.freePeriods);