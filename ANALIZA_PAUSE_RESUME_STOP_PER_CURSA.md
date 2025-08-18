# ANALIZĂ: Operațiuni PAUSE/RESUME/STOP per Cursă Individuală

## ✅ REZULTAT: DA - Se face update pentru fiecare cursă individuală

### 📊 Fluxul Complet Validat

**1. UI Action (CourseDetailCard.tsx)**
```typescript
// Butoanele specifice pentru fiecare cursă:
<button onClick={() => handleAction('pause')}>Pauză</button>    // Pentru cursă specifică
<button onClick={() => handleAction('resume')}>Resume</button>   // Pentru cursă specifică  
<button onClick={() => handleAction('finish')}>Stop</button>     // Pentru cursă specifică

const handleAction = (action: string) => {
  // Determină statusul nou based pe acțiune
  let newStatus = mapActionToStatus(action); // 2=resume, 3=pause, 4=finish
  
  // CRITICA: Apelează cu course.id specific
  onStatusUpdate(course.id, newStatus, action);
};
```
✅ **INDIVIDUAL**: Fiecare card de cursă are propriile butoane de control

**2. Status Update Handler (VehicleScreenProfessional.tsx)**
```typescript
const handleCourseStatusUpdate = async (courseId: string, newStatus: number, action?: string) => {
  // Găsește CURSA SPECIFICĂ după ID
  const courseToUpdate = courses.find((c) => c.id === courseId);
  
  // Update UI imediat DOAR pentru cursa specifică
  setCourses(prevCourses => 
    prevCourses.map(course => 
      course.id === courseId      // DOAR cursa cu ID-ul specific
        ? { ...course, status: newStatus }
        : course                  // Alte curse rămân neschimbate
    )
  );
}
```
✅ **INDIVIDUAL**: Update UI selectiv - doar cursa specificată

**3. Android GPS Service Integration**
```typescript
// In handleCourseStatusUpdate:
if (newStatus === 2) { // START/RESUME
  activeCourses.set(String(courseToUpdate.ikRoTrans), { ...courseToUpdate, status: 2 });
  
} else if (newStatus === 3) { // PAUSE
  activeCourses.set(String(courseToUpdate.ikRoTrans), { ...courseToUpdate, status: 3 });
  // Analytics paused DOAR pentru cursa specifică
  
} else if (newStatus === 4) { // STOP
  activeCourses.delete(String(courseToUpdate.ikRoTrans)); // Șterge DOAR cursa specifică
}

// Trimite status update cu vehicle number specific
AndroidGPS.updateStatus(String(courseToUpdate.uit), newStatus, vehicleNumber);
```
✅ **INDIVIDUAL**: Cada cursă își păstrează statusul independent în activeCourses Map

**4. BackgroundGPSService Android (per-course processing)**
```java
// UPDATE_COURSE_STATUS handler:
String uniqueKeyForUpdate = vehicleForUpdate + "_" + specificUIT; // Unique key pentru cursă specifică
CourseData courseData = activeCourses.get(uniqueKeyForUpdate);    // Găsește DOAR cursa specifică

if (newStatus == 3) { // PAUSE
    courseData.status = 3;  // Update DOAR această cursă
    // GPS transmission blocked DOAR pentru această cursă
    
} else if (newStatus == 4) { // STOP  
    activeCourses.remove(uniqueKeyForUpdate); // Șterge DOAR această cursă
}
```
✅ **INDIVIDUAL**: HashMap key unic per cursă - operațiuni independente

### 🚗 Scenarii de Testare Confirmate

**Mașina A (ABC123) cu 2 curse active:**
- Cursă UIT 456 (Status: ACTIV) 
- Cursă UIT 789 (Status: ACTIV)

**Acțiune: User apasă PAUSE pe cursă 456**
1. **UI**: Doar card-ul pentru cursă 456 se marchează ca PAUSED
2. **Frontend**: `activeCourses.set("456", {...courseData, status: 3})`
3. **Android**: `"ABC123_456"` → status 3, `"ABC123_789"` → rămâne status 2
4. **GPS Transmission**: 
   - Cursă 456: GPS BLOCKED (status 3)
   - Cursă 789: GPS CONTINUES (status 2)

**Rezultat**: Cursă 456 în pauză, cursă 789 continuă normal

**Acțiune: User apasă RESUME pe cursă 456**
1. **UI**: Card cursă 456 revine la ACTIV
2. **Android**: `"ABC123_456"` → status 2
3. **GPS Transmission**: Ambele curse transmit din nou

**Acțiune: User apasă STOP pe cursă 789**
1. **UI**: Card cursă 789 dispare din listă
2. **Frontend**: `activeCourses.delete("789")`  
3. **Android**: `"ABC123_789"` eliminat din HashMap
4. **GPS**: Doar cursă 456 continuă să transmită

### 🔒 Independența Operațiunilor

**Multiple Vehicles Scenario:**
- Mașina A (ABC123): Cursă 456 PAUSE → Doar cursă 456 de la ABC123 oprită
- Mașina B (XYZ789): Cursă 456 ACTIVE → Continuă normal pentru XYZ789  
- Mașina C (DEF111): Cursă 789 ACTIVE → Neafectată de operațiunile ABC123

**Unique Keys garantează independența:**
```
"ABC123_456" → PAUSE (GPS blocked doar pentru această combinație)
"XYZ789_456" → ACTIVE (GPS continuă pentru această combinație)  
"DEF111_789" → ACTIVE (GPS continuă pentru această combinație)
```

## 🎯 CONCLUZIE

**DA, operațiunile PAUSE/RESUME/STOP se aplică pentru fiecare cursă individuală:**

✅ **UI Level**: Butoane specifice per card de cursă
✅ **Frontend**: Update selectiv în array-ul courses și Map-ul activeCourses  
✅ **Android Service**: Unique key system cu operațiuni independente
✅ **GPS Transmission**: Control individual per cursă (block/unblock)
✅ **Multi-Vehicle**: Independență completă între mașini și curse

**Nu există operațiuni globale - fiecare cursă este controlată individual.**