chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var currentUrl = tabs[0].url;
  const form = document.getElementById('review-form');
  const submitButton = document.getElementById('submit-button');
  const reviewResultDiv = document.getElementById('prediction-result');
  const reviewSimilarity = document.getElementById('similarity-percentage');
  const reviewSummarizedtDiv = document.getElementById('summarized-review');
  const reviewSummaryResultDiv = document.getElementById('prediction-summary');

  submitButton.disabled = true;
  form.addEventListener('input', () => {
    submitButton.disabled = document.getElementById('review-text').value.trim() === '';
  });

  form.addEventListener('submit', async (event) => {

    event.preventDefault();

    const inputReview = document.getElementById('review-text').value;

    try {
      submitButton.disabled = true;
      reviewResultDiv.innerText = '';
      reviewSimilarity.innerText = '';
      reviewSummarizedtDiv.innerText = '';
      reviewSummaryResultDiv.innerText = '';
      document.getElementById('spinner').style.display = 'block';

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textReview: inputReview, url: currentUrl }),
      });


      if (response.ok) {
        const data = await response.json();
        const prediction = data.prediction;
        const similarityPercentage = data.percentage
        const summarizedReview = data.summarizedReview;
        const comparison = data.comparison;

        reviewResultDiv.innerText = prediction === 0 ? 'This is a Genuine Review' : 'This Review contains Disinformation';
        reviewSimilarity.innerText = similarityPercentage ? `${similarityPercentage}% Similar to Overall Feedbacks` : 'Something went wrong';
        reviewSummarizedtDiv.innerText = summarizedReview ? summarizedReview : 'Something went wrong';
        reviewSummaryResultDiv.innerText = comparison ? comparison : 'Something went wrong';
      } else {
        console.error('Request failed:', response.status);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
    finally {
      submitButton.disabled = false;
      document.getElementById('spinner').style.display = 'none';
    }

    // Initially hide the p tags
    reviewSimilarity.style.display = 'none';
    reviewSummarizedtDiv.style.display = 'none';
    reviewSummaryResultDiv.style.display = 'none';

    // Show the "See More" button
    let seeMoreButton = document.querySelector('.see-more-button');
    if (!seeMoreButton) {
      const seeMoreButton = document.createElement('button');
      seeMoreButton.textContent = 'See More';
      seeMoreButton.classList.add('see-more-button');
      seeMoreButton.addEventListener('click', () => {
        // Toggle the visibility of the p tags
        const isVisible = reviewSimilarity.style.display !== 'none';
        reviewSimilarity.style.display = isVisible ? 'none' : 'block';
        reviewSummarizedtDiv.style.display = isVisible ? 'none' : 'block';
        reviewSummaryResultDiv.style.display = isVisible ? 'none' : 'block';
        // Toggle the button text
        seeMoreButton.textContent = isVisible ? 'See More' : 'See Less';
      });
      // Append the button to the body or any other container
      document.body.appendChild(seeMoreButton);
    }


  });
});