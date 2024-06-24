class Schedule {
    get workHours(){
        return this._workHours;
    };
    get busyTime(){
        return this._busy;
    };
    get freeTime(){
        if(Object.keys(this._workHours).length === 0) {
            throw new Error('Cannot get freePeriods: necessary data is missing. Please, make sure you have set working hours.')
        }
        if(this._hasChanges){
            const computed = this._computeFreeTimeFrames();
            this._setFreeTimeFrames(computed);
            this._hasChanges = false;
            console.log('recalculated')
        }
        return this._freeTimeFrames;
    }
    set workHours(workHours){
        if(this._checkTimeFrame(workHours)){
            this._workHours = this._normalizeTimeFrame(workHours, Number);
            this._hasChanges = true;
        }else {
            throw new Error('Could not set work hours. Please, make sure you pass an object of format {start: "00:00", stop: "00:00"}');
        }
    };
    set busyTime(busy){
        if(this._checkTimeList(busy)){
            const sorted = this._getSortedTimeList(busy).passed;
            this._busy = [...this._busy, ...sorted.passed];
            this._hasChanges = true;
            console.log(sorted.passed.length + ' added to the list of busy time frames.' + sorted.failed.length + ' failed to load');
        } else {
            throw new Error('Could not set busy time. Please, make sure you pass an array of objects of format {start: "00:00", stop: "00:00"}');
        }
    };
    constructor(workHours={}, busy=[]){
        this._id = this._generateID();
        this._initiateSchedule(workHours, busy);
        
    };
    _generateID(){
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    };
    _initiateSchedule(workHours, busy){
        // check passed data and initialize variables (for constructor method only).
        if(this._checkTimeFrame(workHours)){
            this._workHours = workHours;
            this._hasChanges = true;
        } else this._workHours = {};

        if(this._checkTimeList(busy)){
            this._busy = busy;
            this._hasChanges = true;
        }else {
            this._busy = [];
        };
    };
    _checkTimeFrame(timeFrame){
        //checks if passed data is an object of the type {start: "00:00, stop: "00:00"} or {start: "0:0", stop: "0:0"};
        if(
            Object.prototype.toString.call(timeFrame) === '[object Object]'
            && Object.keys(timeFrame).length === 2
            && Object.keys(timeFrame).includes('start')
            && Object.keys(timeFrame).includes('stop')
            && Object.values(timeFrame).every((value)=> {
                return (
                    typeof value ==='string'
                    && value.search(/^([0-1]?[0-9]|2[0-3]):[0-5][05]?$/)!== -1
                );
            })  
        ) return true;
        return false;
    };
    _checkTimeList(timeList){
         //checks if passed data is a non-empty array
         //as array may contain both right and wrong values,
         //checking of each item is not included in this method
         if(Array.isArray(timeList) || timeList.length > 0) {
            return true
        }
        return false;
    };
    _getSortedTimeList(timeList){
        //iterates through an array of time frames and checks if they are objects of specific format.
        //if an object meets all creteria of _checkTimeFrame, it is put into "passed" list,
        //otherwise it is assigned with its position in the provided array and put into "failed" list.
        //finally an object with both "passed" and "failed" is returned.
        const result = {passed:[], failed:[]};
        timeList.forEach((timeFrame, index)=>{
            if(this._checkTimeFrame(timeFrame)) {
                const normalized = this._normalizeTimeFrame(timeFrame, this._fillWithZero);
                result.passed.push(normalized);
            } else {
                result.failed.push(Object.assign(timeFrame, {position: index}));
            }
        });
        return result
    };
    _normalizeTimeFrame(timeFrame, callback){
        //receiving an object with timeFrame to normalize and a callback to process each time value
        //returns a new object with time in specific format (e.g. {start: [9,0], stop: [9,30]})
        //to prepare data for further processing (like in splitting working hours)
        return Object.entries(timeFrame).reduce((result, entry)=>{
            const timeValue = entry[1].split(':');
            return {
                ...result,
                [entry[0]]: timeValue.map((timePart)=> callback(timePart))
            }
        }, {})
    };
    _fillWithZero(timePart){
        return typeof timePart === 'string'
        ? timePart.padStart(2, '0')
        : typeof timePart === 'number'
        ? timePart.toString().padStart(2, '0')
        : timePart;
    }
    _getFiveMinuteSlots(normalizedTimeFrame){
        //receives normalized working hours object and forms an array of 5-minute time frames.
        //returns the array
        const fiveMinuteSlots = [];
        const pushSlot = (hour, minute) => {
            fiveMinuteSlots.push(`${this._fillWithZero(hour)}:${this._fillWithZero(minute)}`);
        }
        const startHour = normalizedTimeFrame.start[0],
              startMinutes = normalizedTimeFrame.start[1];
        const stopHour = normalizedTimeFrame.stop[0],
              stopMinutes = normalizedTimeFrame.stop[1];
        //work day hours
        if(startHour <= stopHour) {
            for(let i = startHour; i <= stopHour; i+=1) {
                if((i === startHour && startMinutes !== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(i, j);
                    }
                } else if(i === stopHour) {
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
            for(let i = startHour; i <= 23; i+=1) {
                hoursArray.push(i);
            }
            for(let i = 0; i <= stopHour; i+=1) {
                hoursArray.push(i);
            }

            hoursArray.forEach((hour)=> {
                if((hour === startHour && startMinutes!== 0)) {
                    for(let j = startMinutes; j <= 55; j+=5) {
                        pushSlot(hour, j);
                    }
                } else if(hour === stopHour) {
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
        return fiveMinuteSlots;
    };
    _targetBusySlots(fiveMinuteSlots){
        //receives an array of 5-minute time frames, iterates through it and marks busy time frames (based on busy periods previously set).
        //returnes a new array with both free and busy 5 minute time frames.
        const slotsWithTargets = fiveMinuteSlots.map((slot)=> {
            let isBusy = false;
            this._busy.forEach((busyPeriod) => {
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
    _getFreeSlots(targetedSlots){
        // receives an array with both free and marked-busy 5 minute time slots.
        // iterates through it and compiles a new double-dimentional array with 30 minutes time slots.
        //returnes the array
        const thirtyMinuteSlots = [];
        let slot = [];
        let slotStartIndex = 0;
        let slotEndIndex = 6;
        const  refreshSlot= (start)=> {
            slotStartIndex = start;
            slotEndIndex = slotStartIndex + 6;
            slot = [];
        }

        targetedSlots.forEach((currSlot, index)=>{
            if(!currSlot && index === slotEndIndex) {
                const final = targetedSlots[index - 1].split(':');
                final[1] = String(Number(final[1])+ 5);
                slot.push(final.join(':'));
                thirtyMinuteSlots.push(slot);
                refreshSlot(index+1);

                // slotStartIndex = index + 1;
                // slotEndIndex = slotStartIndex + 6;
                // slot = [];
            }
            if(!currSlot) {
                refreshSlot(index+1);
                // slotStartIndex = index + 1;
                // slotEndIndex = slotStartIndex + 6;
                // slot = [];
            }
            if (index === slotEndIndex && currSlot) {
                slot.push(currSlot);
                slot.length === 7 && thirtyMinuteSlots.push(slot);
                refreshSlot(slotEndIndex);
                // slotStartIndex = slotEndIndex;
                // slotEndIndex = slotStartIndex + 6;
                // slot = [];
            }
            if (index < slotEndIndex && currSlot) {
                slot.push(currSlot);
            }
        });
        return thirtyMinuteSlots;   
    };
    _formFreeTimeFramesList(freeSlots) {
        //formats array in such a way that first and last elements of each are taken to form objects of type {start: "00:00", stop: "00:00"}
        //returns the array
        return freeSlots.reduce((result, slotArr)=> {
            return [
                ...result,
                {start: slotArr[0], stop: slotArr[slotArr.length -1]}
            ]
        },[]);
    };
    _computeFreeTimeFrames(){
        const fiveMinuteSlots = this._getFiveMinuteSlots(this._workHours);
        const targetedSlots = this._targetBusySlots(fiveMinuteSlots);
        const freeSlots = this._getFreeSlots(targetedSlots);
        return this._formFreeTimeFramesList(freeSlots);
    };
    _setFreeTimeFrames(timeFrames){
        this._freeTimeFrames = timeFrames;
    }
    _hasChanges = false;
    _freeTimeFrames = [];
};
